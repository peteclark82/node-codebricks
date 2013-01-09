var fs = require("fs"), path = require("path"), ce = require("cloneextend"), async = require("async");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("FileSystemRepository", "codebricks.brickRepositories.fileSystem", function(env, builder) {
	var self = this;

	self.path = builder.defineProperty({ type : "string", defaultValue : null });	
	self.save = builder.defineMethod(save);
	self.get = builder.defineMethod(get);
	
	function save(options, callback) {
		fs.exists(self.path, function(exists) {
			if (!exists) {
				callback({ message : "Repository path does not exists : "+ self.path });
			} else {
				env.methods.BrickTypes.serializeBrick({ brick : options.brick, depth : options.depth }, function(err, brickJsonArray) {
					if (err) { callback(err); } else {
						async.forEachSeries(brickJsonArray, function(brickJson, nextBrickJson) {
							var filename = path.resolve(self.path, brickJson.__.id) +".js";
							env.log("info", "Writing file : "+ filename);
							fs.writeFile(filename, JSON.stringify(brickJson, null, 2), function(err) {
								if (err) { 
									nextBrickJson({ message : "Error saving brick to repository file : "+ filename, error : err.toString() });
								} else {
									nextBrickJson();
								}
							});
						}, callback);
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
				env.methods.BrickTypes.deserializeBrick({ id : options.id, depth : options.depth, offline : options.offline }, function(brickOptions, nextBrick) {
					var filename = path.resolve(self.path, brickOptions.id) +".js";
					fs.exists(filename, function(exists) {
						if (!exists) { nextBrick({ message : "Brick instance not found '"+ brickOptions.id +"' : "+ filename }); } else {
							fs.readFile(filename, function(err, brickJsonStream) {
								if (err) {
									nextBrick({ message : "Error reading brick repository file : "+ filename, error : err.toString() });
								} else {
									var brickJson = null, error = null;
									try {
										var brickJsonString = brickJsonStream.toString();
										brickJson = JSON.parse(brickJsonString);								
									} catch(err) {
										error = err.toString();
									}
									if (error !== null) {
										nextBrick({ message : "Error while parsing brick JSON for file : "+ filename, brickJson : brickJsonString, error : error });
									} else {
										nextBrick(null, brickJson);
									}
								}
							});
						}
					});
				}, callback);
			}
		});
	}
});