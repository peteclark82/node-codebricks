var async = require("async");

var cbLoader = require("./codebricks.loader.js");

module.exports = Environment;

/* Environment */
function Environment() {
	var self = this;

	self.start = start;
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