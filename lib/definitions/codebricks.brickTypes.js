var ce = require("cloneextend"), async = require("async");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.DefinitionType("BrickTypeDefinition", cb.internal.types.brickTypes.BrickTypeDefinition, function(env) {
	var self = this;
	
	var repositories = [];
	
	self.registerRepository = registerRepository;
	self.createBrick = createBrick;
	self.getBrick = getBrick;
	self.saveBrick = saveBrick;
	self.serializeBrick = serializeBrick;
	self.deserializeBrick = deserializeBrick;
	
	function registerRepository(repositoryBrick, callback) {
		repositories.push({
			brick : repositoryBrick
		});
		callback();
	}
	
	function createBrick(brickTypeId, callback) {
		env.getDefinition(cb.internal.types.brickTypes.BrickTypeDefinition, brickTypeId, function(err, brickTypeDef) {
			if (err) {callback(err); } else {
				var brickType = brickTypeDef.createBrickType();
				var brick = brickType.createInstance(env);
				callback(null, brick);
			}
		});
	}
	
	function getBrick(options, callback) {
		if (repositories.length == 0) { callback({ message : "No repository brick registered." }) } else {
			var repositoryBrick = repositories[0].brick;
			repositoryBrick.get(options, callback);
		}
	}
	
	function saveBrick(options, callback) {
		if (repositories.length == 0) { callback({ message : "No repository brick registered." }) } else {
			var repositoryBrick = repositories[0].brick;
			repositoryBrick.save(options, callback);
		}
	}
	
	function serializeBrick(brick, callback) {
		env.getDefinition(cb.internal.types.brickTypes.BrickTypeDefinition, brick.__.brickTypeId, function(err, brickTypeDef) {
			if (err) {callback(err); } else {
				var brickType = brickTypeDef.createBrickType();
				var brickJson = brick;		
				Object.keys(brickType.__.state).forEach(function(key) { delete brickJson[key]; });
				Object.keys(brickType.__.methods).forEach(function(key) { delete brickJson[key]; });
				async.forEachSeries(Object.keys(brickType.__.properties), function(key, nextProperty) {
					var property = brickJson[key];
					var propertyType = brickType[key];
					env.methods.BrickPropertyTypeDefinition.serialize({ propertyType : propertyType, value : property }, function(err, value) {
						if (err) { nextProperty(err); } else {
							brickJson[key] = value;
							nextProperty();
						}
					});
				}, function(err) {
					if (err) { callback(err); } else {
						callback(null, brickJson);
					}
				});	
			}
		});
	}
	
	function deserializeBrick(brickJson, callback) {
		var brickTypeId = brickJson.__.brickTypeId;
		createBrick(brickTypeId, function(err, brick) {
			if (err) {callback(err);} else {
				ce.extend(brick, brickJson);
				
				env.getDefinition(cb.internal.types.brickTypes.BrickTypeDefinition, brick.__.brickTypeId, function(err, brickTypeDef) {
					if (err) {callback(err); } else {
						var brickType = brickTypeDef.createBrickType();
						async.forEachSeries(Object.keys(brickType.__.properties), function(key, nextProperty) {
							var property = brick[key];
							var propertyType = brickType[key];
							env.methods.BrickPropertyTypeDefinition.deserialize({ propertyType : propertyType, value : property }, function(err, value) {
								if (err) { nextProperty(err); } else {
									brick[key] = value;
									nextProperty();
								}
							});
						}, function(err) {
							if (err) { callback(err); } else {
								callback(null, brick);
							}
						});
					}
				});
			}
		})
	}
});