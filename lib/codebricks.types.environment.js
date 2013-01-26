var async = require("async"), colors = require("colors");

var definitionsLoader = require("./definitions.loader.js");

module.exports = Environment;

/* Environment */
function Environment() {
	var self = this;

	self.start = start;
	self.guard = guard;
	self.log = log;
	
	function start(definitionSources, callback) {
		log("event", "Loading definitions from sources :-");
		log("data", JSON.stringify(definitionSources, null, 2));
		definitionsLoader.load(definitionSources, function(err, definitions) {
			if (err) { callback(err); } else {
				self.methods = {};
				definitions.DefinitionTypes.forEach(function(definitionType) {
					self.methods[definitionType.definition.name] = new definitionType.definition.methods(self, definitions);
				});
				log("event", "Environment started.");
				callback();
			}
		});
	}
	
	function guard() {
		var args = Array.prototype.slice.apply(arguments);
		var condition = args.shift();
		var error = args.length > 1 ? args.shift() : condition;
		var innerException = args.length > 1 ? args.shift() : undefined;
		var callback = args.shift();
		
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
		var formattedType = "[" + type + "] ";
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
		
		var formattedCaller = "\n--> "+ callers[1];
		
		switch (type) {
			case "info" :
				formattedMessage = (formattedType + message + formattedCaller).grey;
				break;
			case "data" :
				formattedMessage = (formattedType +"** Start **").yellow.bold + formattedCaller.yellow +"\n";
				formattedMessage += message +"\n";
				formattedMessage += (formattedType +"** End **").yellow.bold + formattedCaller.yellow +"\n";
				break;
			case "error" :
				formattedMessage = (formattedType +"** Start **").red.bold + formattedCaller.red +"\n" ;
				formattedMessage += message +"\n";
				formattedMessage += (formattedType +"** End **").red.bold + formattedCaller.red +"\n";
				break;
			case "event" :
				formattedMessage = (formattedType + message.bold +  formattedCaller).cyan.bold;
				break;
			default : 
				formattedMessage = formattedType + message + formattedCaller;
				break;
		}
				
		if (type === "error") {
			console.error(formattedMessage);
		} else {
			console.log(formattedMessage);
		}		
	}
}
