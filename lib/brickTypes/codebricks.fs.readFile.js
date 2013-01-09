var fs = require("fs"), path = require("path");
var cb = require("../codebricks");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("ReadFile", "codebricks.fs.readFile", function(env, builder) {
	builder.implements(
		{ type : "codebricks.data.IBufferProvider" },
		{ type : "codebricks.data.IStringProvider" }
	);
	
	var self = this;
		
	self.filename = builder.defineProperty({ type : "string" });
	self.getBuffer = builder.defineMethod(getBuffer);
	self.getString = builder.defineMethod(getString);
	
	function getBuffer(options, callback) {
		var filename = path.join(process.cwd(), self.filename);
		fs.readFile(filename, function(err, contentBuffer) {
			if (err) { callback({ message : "Error reading file : "+ filename, error : err.toString() }); } else {
				callback(null, contentBuffer);
			}
		});		
	}
	
	function getString(options, callback) {
		getBuffer(options, function(err, value) {
			if (err) {callback(err);} else {
				callback(null, value.toString());
			}
		});	
	}
});