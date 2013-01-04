var ce = require("cloneextend");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.DefinitionType("BrickTypeDefinition", cb.internal.types.brickTypes.BrickTypeDefinition, function(env) {
	var self = this;
	
	self.createBrick = createBrick;
	self.serializeBrick = serializeBrick;
	self.deserializeBrick = deserializeBrick;
	
	function createBrick(brickTypeId, callback) {
		env.getDefinition(cb.internal.types.brickTypes.BrickTypeDefinition, brickTypeId, function(err, brickTypeDef) {
			if (err) {callback(err); } else {
				var brickType = brickTypeDef.createBrickType();
				var brick = brickType.createInstance(env);
				callback(null, brick);
			}
		});
	}
	
	function serializeBrick(brick, callback) {
		var brickJson = brick;
		/* Need to strip off all state properties */
		/* Need to strip off (TBD) repositoryId */
		/* Need to replace codebrick properties with references */
		callback(null, brickJson);
	}
	
	function deserializeBrick(brickJson, callback) {
		var brickTypeId = brickJson.__.brickTypeId;
		createBrick(brickTypeId, function(err, brick) {
			if (err) {callback(err);} else {
				ce.extend(brick, brickJson);
				callback(null, brick);
			}
		})
	}
});