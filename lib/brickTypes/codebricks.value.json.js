var http = require("http"), express = require("express");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("ValueJson", "codebricks.value.json", function(env, builder) {
	builder.implements(
		{ type : "codebricks.data.IDataProvider" }
	);
	
	var self = this;
	
	self.value = builder.defineProperty({ type : "json" });
	self.getData = builder.defineMethod(getData);
	
	function getData(options, callback) {
		callback(null, self.value);
	}
});