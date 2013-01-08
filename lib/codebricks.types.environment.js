var async = require("async"), colors = require("colors");

var cbLoader = require("./codebricks.loader.js");

module.exports = Environment;

/* Environment */
function Environment() {
	var self = this;

	self.start = start;
	self.getDefinition = getDefinition;
	self.log = log;
	
	function start(definitionSources, callback) {
		log("event", "Loading definitions from sources :-");
		log("data", JSON.stringify(definitionSources, null, 2));
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
				}, function(err) {
					if (err) {callback(err);} else {
						log("event", "Environment started.");
						callback();
					}
				});
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
			callback({ message : "Definition type '"+ definitionType.name +"' not found for id '"+ typeId +"'", definitionType : definitionType, definitionsForType : definitionsForType });
		}
	}
	
	function log(type, message) {
		var color = null;
		var formattedType = "<< " + type + " >>";
		var formattedMessage = null;
		
		switch (type) {
			case "info" :
				formattedMessage = (formattedType +" --> " + message).grey;
				break;
			case "data" :
				formattedMessage = (formattedType +" --| ** Start **\n").yellow.bold ;
				formattedMessage += message +"\n";
				formattedMessage += (formattedType +" --| ** End **").yellow.bold;
				break;
			case "error" :
				formattedMessage = (formattedType +" --| ** Start **\n").red.bold ;
				formattedMessage += message +"\n";
				formattedMessage += (formattedType +" --| ** End **").red.bold;
				break;
			case "event" :
				formattedMessage = (formattedType +" --> " + message.bold).cyan.bold;
				break;
			default : 
				formattedMessage = formattedType +" --> " + message;
				break;
		}
		
		if (type === "error") {
			console.error(formattedMessage);
		} else {
			console.log(formattedMessage);
		}		
	}
}