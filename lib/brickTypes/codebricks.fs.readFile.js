var fs = require("fs"), path = require("path");
var cb = require("../codebricks");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("ReadFile", "codebricks.fs.readFile", function(env, builder) {
	var self = this;
	
	self.filename = builder.defineProperty({ type : "string" });
	self.getBuffer = builder.defineMethod(getBuffer);
	
	function getBuffer(options, callback) {
		var filename = path.join(process.cwd(), self.filename);
		fs.readFile(filename, function(err, contentBuffer) {
			if (err) { callback({ message : "Error reading file : "+ filename, error : err.toString() }); } else {
				callback(null, contentBuffer);
			}
		});		
	}
});