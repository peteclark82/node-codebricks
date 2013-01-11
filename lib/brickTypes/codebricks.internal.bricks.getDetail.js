var http = require("http"), express = require("express");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("GetBricks", "codebricks.internal.bricks.getDetail", function(env, builder) {
	builder.implements(
		{ type : "codebricks.data.IDataProvider" }
	);
	
	var self = this;
	
	self.brickId = builder.defineProperty({ type : "string" });
	self.getData = builder.defineMethod(getData);
	
	function getData(options, callback) {
		env.methods.BrickTypes.getBrick({ id : self.brickId, depth : true }, function(err, brick) {
			if (env.guard(err, callback)) {return;}
			env.methods.BrickTypes.getBrickType({ brickTypeId : brick.__.brickTypeId }, function(err, brickType) {
				if (env.guard(err, callback)) {return;}				
				var brickItem = {
					brick : brick,
					brickType : brickType
				};
				callback(null, brickItem);
			});
		});
	}
});