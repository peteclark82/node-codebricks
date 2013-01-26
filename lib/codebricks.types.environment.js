var async = require("async"), colors = require("colors");

var logger = require("./codebricks.logger.js");
var definitionsLoader = require("./codebricks.definitions.loader.js");

module.exports = Environment;

/* Environment */
function Environment() {
	var self = this;

	self.start = start;
	self.guard = guard;
	self.log = logger.log;
	
	function start(definitionSources, callback) {
		logger.log("event", "Loading definitions from sources :-");
		logger.log("data", JSON.stringify(definitionSources, null, 2));
		definitionsLoader.load(definitionSources, function(err, definitions) {
			if (err) { callback(err); } else {
				self.methods = {};
				definitions.DefinitionTypes.forEach(function(definitionType) {
					self.methods[definitionType.definition.name] = new definitionType.definition.methods(self, definitions);
				});
				logger.log("event", "Environment started.");
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
}