var express = require("express"), async = require("async");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("ContentRoute", "codebricks.net.contentRoute", function(env, builder) {
	var self = this;
	
	self.path = builder.defineProperty({ type : "regex" });
	self.content = builder.defineProperty({ type : "codebrick", implements : [ "codebricks.data.IDataProvider" ] });
	self.onRequest = builder.defineMethod(onRequest);
	
	function onRequest(options, callback) {
		var req = options.request, res = options.response;
		if (self.path === undefined) { callback(null, false); } else {
			var match = self.path.exec(req.url);
			if (match == null) { callback(null, false); } else {
				if (self.content === undefined) {
					callback({ message : "No content defined for route : "+ self.path.toString() });
				} else {
					self.content.__.context.set("request", req);
					self.content.getData({ request : req }, function(err, contentBuffer) {
						if (err) { callback(err); } else {
							res.statusCode = 200;
							res.end(contentBuffer);
							callback(null, true);
						}
					});
				}
			}
		}		
	}
});