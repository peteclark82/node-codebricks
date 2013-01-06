var fs = require("fs"), path = require("path"), ce = require("cloneextend");
var cb = require("../codebricks.js");

module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("FileSystemRepository", "codebricks.brickRepositories.fileSystem", function(builder, env) {
	var self = this;

	self.path = builder.defineProperty({ type : "string", defaultValue : null });	
	self.save = builder.defineMethod(save);
	self.get = builder.defineMethod(get);
	
	function save(options, callback) {
		fs.exists(self.path, function(exists) {
			if (!exists) {
				callback({ message : "Repository path does not exists : "+ self.path });
			} else {
				var filename = path.resolve(self.path, options.brick.__.id) +".js";
				env.methods.BrickTypeDefinition.serializeBrick(options.brick, function(err, brickJson) {
					if (err) {callback(err);} else {
						fs.writeFile(filename, JSON.stringify(brickJson, null, 2), function(err) {
							if (err) {
								callback({ message : "Error saving brick to repository file : "+ filename, error : err.toString() });
							} else {
								callback();
							}
						});
					}
				});
			}
		});
	}
	
	function get(options, callback) {
		fs.exists(self.path, function(exists) {
			if (!exists) {
				callback({ message : "Repository path does not exists : "+ self.path });
			} else {
				var filename = path.resolve(self.path, options.id) +".js";
				fs.exists(filename, function(exists) {
					if (!exists) {
						callback({ message : "Brick instance not found '"+ options.id +"' : "+ filename });
					} else {
						fs.readFile(filename, function(err, brickJsonStream) {
							if (err) {
								callback({ message : "Error reading brick repository file : "+ filename, error : err.toString() });
							} else {
								var brickJson = JSON.parse(brickJsonStream.toString());
								env.methods.BrickTypeDefinition.deserializeBrick(brickJson, function(err, brick) {
									callback(err, brick);
								});
							}
						});
					}
				});
			}
		});
	}
});