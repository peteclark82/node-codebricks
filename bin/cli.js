#!/usr/bin/env node

var path = require("path"), colors = require("colors"), async = require("async"),
		optimist = require("optimist");

var cb = require("../lib/codebricks.js");

var cli = createCli();
var args = cli.argv;

if (args.help === true) { cli.showHelp(); } else {
	loadConfiguration(path.resolve(process.cwd(), args.config), function(err, config) {
		if (err) { logError(err); return; }
		cb.createEnvironment({ sources : config.sources }, function(err, env) {
			if (err) { logError(err); return; }
			config.onStart(env);
		});
	});
}

/* Private Functions */
function createCli() {
	return optimist
		.usage('Executes codebricks using the specified configuration.'.bold.yellow + '\nUsage: $0 -c <config>'.yellow)
		.default('h', false).boolean('h').alias('h', 'help').describe('h', 'Shows the usage information')
    .demand('c').string('c').alias('c', 'config').describe('c', 'Configuration file describing codebricks environment');
}

function loadConfiguration(configFile, callback) {
	if (path.extname(configFile) == "") { configFile += ".js"; }
	var config = null;
	try { config = require(configFile); } catch(err) {
		callback({ message : "Error loading configuration file : " + configFile, error : err.toString(), stack : err.stack.split('\n') });
	}
	if (config !== null) { callback(null, config); } 
}

function logError(err) {
	console.error(JSON.stringify(err, null, 2).bold.red);
}