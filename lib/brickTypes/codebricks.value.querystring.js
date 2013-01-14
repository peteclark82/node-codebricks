var url = require("url"), querystring = require("querystring");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("ValueQueryString", "codebricks.value.querystring", function(env, builder) {
	builder.implements(
		{ type : "codebricks.data.IDataProvider" }
	);
	
	var self = this;
	
	self.key = builder.defineProperty({ type : "string" });
	self.getData = builder.defineMethod(getData);
	
	function getData(options, callback) {
		var request = this.__.context.get("request");
		var u = url.parse(request.url);
		var qs = querystring.parse(u.query);
		var value = qs[self.key];
		if (value === undefined) {
			callback({ message : "Key not found on query string : "+ self.key });
		} else {
			callback(null, value);
		}
	}
});