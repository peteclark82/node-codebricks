var logger = require("./codebricks.logger.js");
var errorHandling = require("./codebricks.errorHandling.js");
var definitionsLoader = require("./codebricks.definitions.loader.js");

module.exports = Environment;

/* Environment */
function Environment() {
	var self = this;

	self.start = start;
	self.guard = errorHandling.guard;
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
}