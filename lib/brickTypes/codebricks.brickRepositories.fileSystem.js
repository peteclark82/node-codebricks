var fs = require("fs"), path = require("path"), ce = require("cloneextend"), async = require("async");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("FileSystemRepository", "codebricks.brickRepositories.fileSystem", function(env, builder) {
	var self = this;

	self.path = builder.defineProperty({ type : "string", defaultValue : null });	
	self.save = builder.defineMethod(save);
	self.get = builder.defineMethod(get);
	
	function save(options, callback) {
		fs.exists(self.path, function(exists) {
			if (env.guard(!exists, "Repository path does not exists : "+ self.path, callback)) {return;}
			env.methods.BrickTypes.deinitialiseBrick({ brick : options.brick, batch : options.batch }, function(err, brickJson) {
				if (env.guard(err, "Error serializing brick", err, callback)) {return;}
				var filename = path.resolve(self.path, brickJson.__.id) +".js";
				env.log("info", "Writing file : "+ filename);
				fs.writeFile(filename, JSON.stringify(brickJson, null, 2), function(err) {
					if (env.guard(err, "Error saving brick to repository file : "+ filename, err, callback)) {return;}
					callback();
				});
			});
		});
	}
	
	function get(options, callback) {
		fs.exists(self.path, function(exists) {
			if (env.guard(!exists, "Repository path does not exists : "+ self.path, callback)) {return;}
			var filename = path.resolve(self.path, options.id) +".js";
			env.log("info", "FileSystemRepository getting brick from file : "+ filename);
			fs.exists(filename, function(exists) {
				if (env.guard(!exists, "Brick instance not found '"+ options.id +"' : "+ filename, callback)) {return;}
				fs.readFile(filename, function(err, brickJsonStream) {
					if (env.guard(err, "Error reading brick repository file : "+ filename, err, callback)) {return;}
					var brickJson = null, error = null;
					try {
						var brickJsonString = brickJsonStream.toString();
						brickJson = JSON.parse(brickJsonString);															
					} catch(err) { error = err.toString(); }
					if (env.guard(error !== null, "Error while parsing brick JSON for file : "+ filename, err, callback)) { return; }
					env.methods.BrickTypes.initialiseBrick({ brickJson : brickJson, batch : options.batch }, callback);
				});
			});
		});
	}
});