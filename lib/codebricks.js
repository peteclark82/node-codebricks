var path = require("path");
		
var cbi = require("./codebricks.internal.js");

module.exports = {
	internal : cbi,
	createEnvironment : createEnvironment
};

function createEnvironment(options, callback) {
	var environment = new cbi.types.Environment();
	
	var definitionSources = options.definitions;
	definitionSources = definitionSources.concat([
		path.resolve(__dirname, "brickTypes"),
		path.resolve(__dirname, "brickPropertyTypes"),
		path.resolve(__dirname, "brickInterfaces"),
		path.resolve(__dirname, "definitionTypes")
	]);
	
	environment.start(definitionSources, function(err) {
		if (err) {callback(err);} else {
			callback(null, environment);
		}
	});
}