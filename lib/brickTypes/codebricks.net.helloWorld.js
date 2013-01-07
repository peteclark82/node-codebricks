var http = require("http"), express = require("express");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("HelloWorld", "codebricks.net.helloWorld", function(env, builder) {
	var self = this;
	
	self.message = builder.defineProperty({ type : "string", defaultValue : "Hello World!" });
	self.onRequest = builder.defineMethod(onRequest);
	
	function onRequest(options, callback) {
		options.response.end(self.message);
		callback(null, true);
	}
});