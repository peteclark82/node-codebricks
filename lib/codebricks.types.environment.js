var async = require("async"), colors = require("colors");

var cbLoader = require("./codebricks.loader.js");

module.exports = Environment;

/* Environment */
function Environment() {
	var self = this;

	self.start = start;
	self.getDefinition = getDefinition;
	self.getDefinitions = getDefinitions;
	self.guard = guard;
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
		} else if (typeId === undefined) {
			throw new Error("Error getting definition typeId is undefined");
		} else {
			for(var i=0; i<definitionsForType.length; i++) {
				if (definitionsForType[i].definition.id === typeId) {
					callback(null, definitionsForType[i].definition);
					return; //exit function
				}
			}
			
			callback({ message : "Definition type '"+ definitionType.name +"' not found for id '"+ typeId +"'", definitionType : definitionType, definitionsForType : definitionsForType });
		}
	}
	
	function getDefinitions(definitionType, typeIds, callback) {
		async.map(typeIds, function(typeId, nextTypeId) {
			getDefinition(definitionType, typeId, nextTypeId);
		}, callback);
	}
	
	function guard() {
		var condition = arguments[0];
		var error = arguments[1];
		var innerException = arguments.length == 4 ? arguments[2] : undefined;
		var callback = arguments.length == 4 ? arguments[3] : arguments[2];
		
		if (condition) {
			var errorObj = {};
			if (error instanceof Error) {
				errorObj.message = error.message;
				errorObj.stack = error.stack;
			} else if (typeof(error) == "string") {
				errorObj.message = error;
				errorObj.stack = new Error().stack;
			} else {
				errorObj.message = JSON.stringify(error, null, 2);
				errorObj.stack = new Error().stack;
				errorObj.innerException = innerException;
			}
			callback(errorObj);
			return true;
		} else {
			return false;
		}		
	}
	
	/* Need to refactor!! */
	function log(type, message) {
		var color = null;
		var formattedType = "<< " + type + " >>";
		var formattedMessage = null;
		
		var stack = new Error().stack;
		var callerRe = /(\s+at.+(\(.+\)))\n|(\s+at\s(.+))\n/g;
		var callers = [];
		var match = callerRe.exec(stack);
		while(match !== null) {
			var filename = match[2];
			if (filename === undefined) { 
				filename = "("+ match[4] +")";
			}
			callers.push(filename);
			match = callerRe.exec(stack);
		}
		
		var formattedCaller = "  --- "+ callers[1] +"";
		
		switch (type) {
			case "info" :
				formattedMessage = (formattedType +" --> " + message + formattedCaller).grey;
				break;
			case "data" :
				formattedMessage = (formattedType +" --| ** Start **").yellow.bold + formattedCaller.yellow +"\n";
				formattedMessage += message +"\n";
				formattedMessage += (formattedType +" --| ** End **").yellow.bold + formattedCaller.yellow +"\n";
				break;
			case "error" :
				formattedMessage = (formattedType +" --| ** Start **").red.bold + formattedCaller.red +"\n" ;
				formattedMessage += message +"\n";
				formattedMessage += (formattedType +" --| ** End **").red.bold + formattedCaller.red +"\n";
				break;
			case "event" :
				formattedMessage = (formattedType +" --> " + message.bold +  formattedCaller).cyan.bold;
				break;
			default : 
				formattedMessage = formattedType +" --> " + message + formattedCaller;
				break;
		}
				
		if (type === "error") {
			console.error(formattedMessage);
		} else {
			console.log(formattedMessage);
		}		
	}
}
