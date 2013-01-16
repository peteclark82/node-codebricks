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
		
		app.all(/.+/, handleRequest);
		
		app.listen(self.port, function(err) {
			if (env.guard(err, "Error starting ExpressServer", err, callback)) {return;}
			env.log("info", "Express Server listening on port : "+ self.port);
			self.app.set(app, function(err) {
				if (env.guard(err, callback)) {return;}
				self.server.set(server, callback);
			});
		});
	}
	
	/* Private Functions */
	function handleRequest(request, response) {
		var requestDomain = domain.create();
		requestDomain.on("error", handleError(request, response));
		
		env.methods.BrickTypes.isolate({ brick : self, context : { request : request } }, function(err, self) {
			if (env.guard(err, handleError(request,response))) {return;}
			async.forEachSeries(self.handlers, function(handler, nextHandler) {
				requestDomain.run(function() {
					env.log("event", "Request URL : "+ request.url);
					handler.onRequest({ request : request, response : response }, nextHandler);
				});
			}, function(err) {
				if (env.guard(err, handleError(request,response))) {return;}
				response.statusCode = 404;
				response.end("Resource not found");
			});
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