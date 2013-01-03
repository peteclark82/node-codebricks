var cb = require("../codebricks.js"), cbLoader = require("../codebricks.loader.js");

module.exports = new cb.internal.types.DefinitionType("BrickTypeDefinition", cb.internal.types.brickTypes.BrickTypeDefinition, function(env) {
	var self = this;
	
	self.createBrick = createBrick;
	
	function createBrick(brickTypeId, callback) {
		cbLoader.getDefinitionType(env.definitions, cb.internal.types.brickTypes.BrickTypeDefinition, brickTypeId, function(err, brickTypeDef) {
			if (err) {callback(err); } else {
				var brickType = brickTypeDef.createBrickType();
				var brick = brickType.createInstance(self);
				callback(null, brick);
			}
		});
	}
});