var http = require("http"), express = require("express");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("ValueString", "codebricks.value.string", function(env, builder) {
	builder.implements(
		{ type : "codebricks.data.IStringProvider" }
	);
	
	var self = this;
	
	self.value = builder.defineProperty({ type : "string" });
	self.getString = builder.defineMethod(getString);
	
	function getString(options, callback) {
		callback(null, self.value);
	}
});