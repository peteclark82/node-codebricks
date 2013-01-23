var express = require("express"), async = require("async");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("ContentRoute", "codebricks.net.contentRoute", function(env, builder) {
	var self = this;
	
	self.url = builder.defineProperty({ type : "regex" });
	self.content = builder.defineProperty({ type : "codebrick", implements : [ "codebricks.data.IDataProvider" ] });
	self.onRequest = builder.defineMethod(onRequest);
	
	// Example for circular reference until unit tests!! Soon!!
	self.test = builder.defineProperty({ type : "codebrick" });
	
	function onRequest(options, callback) {
		var req = options.request, res = options.response;
		if (self.url === undefined) { callback(null, false); } else {
			var match = self.url.exec(req.url);
			if (match == null) { callback(null, false); } else {
				if (self.content === undefined) {
					callback({ message : "No content defined for route : "+ self.url.toString() });
				} else {			
					self.content.getData({ request : req }, function(err, contentBuffer) {
						if (err) { callback(err); } else {
							res.statusCode = 200;
							res.end(contentBuffer);
						}
					});
				}
			}
		}		
	}
});