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
	
	var environment = new CodeBricksEnvironment();
	
	environment.start(definitionSources, function(err) {
		if (err) {callback(err);} else {
			callback(null, environment);
		}
	});
}

function CodeBricksEnvironment() {
	var self = this;

	self.start = start
	self.getDefinition = getDefinition;
	
	function start(definitionSources, callback) {
		cbLoader.loadDefinitions(definitionSources, function(err, loaded) {
			if (err) { callback(err); } else {
				self.definitions = loaded.definitions;
				self.definitionTypes = loaded.definitionTypes;
				self.methods = {};
		
				async.forEachSeries(self.definitionTypes, function(definitionType, nextDefinitionType) {
					if (self.methods[definitionType.name] !== undefined) {
						nextDefinitionType({ message : "Definition type methods already defined : "+ definitionType.name });
					} else {
						if (definitionType.methods) {
							self.methods[definitionType.name] = new definitionType.methods(self);
						}
						nextDefinitionType();
					}
				}, callback);
			}
		});
	}
	
	function getDefinition(definitionType, typeId, callback) {
		var definitionsForType = self.definitions[definitionType];
		if (definitionsForType === undefined) {
			callback({ message : "Definition type not registered : "+ definitionType.name });
		} else {
			for(var i=0; i<definitionsForType.length; i++) {
				if (definitionsForType[i].definition.id === typeId) {
					callback(null, definitionsForType[i].definition);
					return;
				}
			}
			callback({ message : "Definition type '"+ definitionType.name +"' not found for id '"+ typeId +"'", definitionType : definitionType });
		}
	}
}