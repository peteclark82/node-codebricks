var http = require("http"), express = require("express");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("ValueString", "codebricks.value.string", function(env, builder) {
	builder.implements(
		{ type : "codebricks.data.IDataProvider" }
	);
	
	var self = this;
	
	self.value = builder.defineProperty({ type : "string" });
	self.getData = builder.defineMethod(getData);
	
	function getData(options, callback) {
		callback(null, self.value);
	}
});