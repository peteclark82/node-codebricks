var async = require("async");

var DefinitionType = require("../codebricks.types.definitionType.js");

module.exports = new DefinitionType("DefinitionTypes", DefinitionType, function(env, definitions) {
	var self = this;
	
	self.getDefinition = getDefinition;
	self.getDefinitions = getDefinitions;
	
	function getDefinition(definitionType, typeId, callback) {
		var definitionsForType = definitions[definitionType];
		if (definitionsForType === undefined) {
			callback({ message : "Definition type not registered : "+ definitionType });
		} else if (typeId === undefined) {
			throw new Error("Error getting definition typeId is undefined");
		} else {
			for(var i=0; i<definitionsForType.length; i++) {
				if (definitionsForType[i].definition.id === typeId) {
					callback(null, definitionsForType[i].definition);
					return; //exit function
				}
			}
			
			callback({ message : "Definition type '"+ definitionType +"' not found for id '"+ typeId +"'", definitionsForType : definitionsForType });
		}
	}
	
	function getDefinitions(definitionType, typeIds, callback) {
		async.map(typeIds, function(typeId, nextTypeId) {
			getDefinition(definitionType, typeId, nextTypeId);
		}, callback);
	}	
});