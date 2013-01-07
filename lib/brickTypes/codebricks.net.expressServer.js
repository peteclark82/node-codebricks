var express = require("express"), async = require("async");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("ExpressServer", "codebricks.net.expressServer", function(env, builder) {
	var self = this;
	
	self.server = builder.defineState({ isVolatile : true, defaultValue : null });
	self.port = builder.defineProperty({ type : "number", defaultValue : 8123 });
	self.handlers = builder.defineProperty({ type : "codebrick", mode : "array" });
	self.start = builder.defineMethod(start);
	
	function start(options, callback) {
		var app = express();
		
		app.all(/.+/, handleRequest);
		
		app.listen(self.port, function(err) {
			if (err) { callback({ message : "Error starting HttpServer", error : err }); } else {
				console.log("Express Server listening on port : "+ self.port);
				self.server.set(app, callback);
			}
		});
		
		function handleRequest(request, response) {
			var wasHandled = false;
			async.forEachSeries(self.handlers, function(handler, nextHandler) {
				if (wasHandled) { nextHandler(); } else {
					handler.onRequest({ request : request, response : response }, function(err, handled) {
						if (err) { nextHandler(err); } else {
							if (handled === true) {
								wasHandled = true;
							}
							nextHandler();
						}
					});
				}
			}, function(err) {
				if (err) {
					response.statusCode = 500;
					response.end(JSON.stringify(err, null, 2));
				} else {
					if (!wasHandled) {
						response.statusCode = 404;
						response.end("Resource Not Found.");
					}
				}
			})
		}
	}
});