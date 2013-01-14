var http = require("http"), express = require("express"), async = require("async");
var domain = require("domain"), vm = require("vm");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("ExpressServer", "codebricks.net.expressServer", function(env, builder) {
	var self = this;
	
	self.app = builder.defineState({ isVolatile : true, defaultValue : null });
	self.server = builder.defineState({ isVolatile : true, defaultValue : null });
	
	self.port = builder.defineProperty({ type : "number", defaultValue : 8123 });
	self.handlers = builder.defineProperty({ type : "codebrick", mode : "array" });
	self.services = builder.defineProperty({ type : "codebrick", mode : "array", implements : ["codebricks.net.IHttpService"] });
	
	self.start = builder.defineMethod(start);
	
	function start(options, callback) {
		var app = express();
		var server = http.createServer(app);
		
		app.all(/.+/, function(request, response) {
			handleRequest(request, response);
		});
		
		app.listen(self.port, function(err) {
			if (err) { callback({ message : "Error starting ExpressServer", error : err }); } else {
				env.log("info", "Express Server listening on port : "+ self.port);
				self.app.set(app, function(err) {
					if (err) {callback(err);} else {
						self.server.set(server, callback);
					}
				});
			}
		});
	}
	
	/* Private Functions */
	function handleRequest(request, response) {
		var requestDomain = domain.create();
		requestDomain.on("error", handleError(request, response));
		
		var wasHandled = false;
		async.forEachSeries(self.handlers, function(handler, nextHandler) {
			if (wasHandled) { nextHandler(); } else {
				requestDomain.run(function() {
					env.log("event", "Request URL : "+ request.url);
					handler.onRequest({ request : request, response : response }, function(err, handled) {
						if (err) { nextHandler(err); } else {
							if (handled === true) {
								wasHandled = true;
							}
							nextHandler();
						}
					});
				});
			}
		}, function(err) {
			if (err) { handleError(request,response)(err); } else {
				if (!wasHandled) {
					response.statusCode = 404;
					response.end("Resource not found");
				}
			}
		});
	}
	
	function handleError(request, response) {
		return function(err) {
			var message = "unknown";
			if (err instanceof Error) {
				message = "Request resulted in an uncaught exception :-\n\n";
				message += err.message +"\n\n"+ err.stack +"\n";			
			} else {
				message = JSON.stringify(err, null, 2);
			}
			response.statusCode = 500;
			response.end(message);
			env.log("error", message);
		};
	}
});