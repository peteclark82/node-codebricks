var http = require("http");
var cb = require("../codebricks.js"), async = require("async");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("HttpServer", "codebricks.net.httpServer", function(env, builder) {
	var self = this;
	self.server = builder.defineState({ isVolatile : true, defaultValue : null });
	
	self.port = builder.defineProperty({ type : "number", defaultValue : 8123 });
	self.handlers = builder.defineProperty({ type : "codebrick", mode : "array" });
	
	self.start = builder.defineMethod(start);
	
	function start(options, callback) {
		var server = http.createServer();
		async.forEachSeries(self.handlers, function(handler, nextHandler) {
			handler.start({ server : server }, nextHandler);
		}, function(err) {
			if (err) { callback(err); } else {
				server.listen(self.port, function(err) {
					if (err) { callback({ message : "Error starting HttpServer", error : err }); } else {
						console.log("HttpServer listening on port : "+ self.port);
						self.server.set(server, callback);
					}
				});
			}
		});
	}
});