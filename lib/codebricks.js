var async = require("async"), fs = require("fs"), path = require("path");

var cbi = require("./codebricks.internal.js"), cbLoader = require("./codebricks.loader.js");

module.exports = {
	internal : cbi,
	createEnvironment : createEnvironment
};

function createEnvironment(options, callback) {
	var definitionSources = options.definitions;
	definitionSources = definitionSources.concat([
		path.resolve(__dirname, "brickTypes"),
		path.resolve(__dirname, "definitions")
	]);

	cbLoader.loadDefinitions(definitionSources, function(err, definitions) {
		if (err) { callback(err); } else {
			var environment = new CodeBricksEnvironment(definitions);
			callback(null, environment);
		}
	});
}

function CodeBricksEnvironment(definitions) {
	var self = this;
	
	self.definitions = definitions;
	
	self.createBrick = createBrick;
	
	function createBrick(brickTypeId, callback) {
		var brickTypeDefinitions = self.definitions[cbi.types.brickTypes.BrickTypeDefinition];
		cbLoader.getDefinitionType(definitions, cbi.types.brickTypes.BrickTypeDefinition, brickTypeId, function(err, brickTypeDef) {
			if (err) {callback(err); } else {
				var brickType = brickTypeDef.createBrickType();
				var brick = brickType.createInstance(self);
				callback(null, brick);
			}
		});
	}
}