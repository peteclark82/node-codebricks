var async = require("async"), fs = require("fs"), path = require("path"),
		walk = require('walk');

var definitionTypesDefinitionType = require("./definitionTypes/codebricks.definitionTypes.js");

module.exports = {
	load : load
};

/* Public Methods */
function load(definitionSources, callback) {
	console.log("Scanning for DefinitionTypes...");
	loadDefinitionTypes(definitionSources, function(err, definitionTypes) {
		if (err) { callback(err); } else {
			console.log("...finished loading DefinitionTypes");
			console.log(JSON.stringify(definitionTypes, null, 2));
			console.log("Scanning for definitions...");
			loadDefinitionsFromSource(definitionTypes, definitionSources, function(err, definitions) {
				if (err) { callback({ message : "Error loading definitions", error : err }); } else {
					console.log("...finished loading definitions");
					callback(null, definitions);
				}
			});
		}
	})
}

/* Private Functions */
function loadDefinitionTypes(definitionSources, callback) {
	loadDefinitionsFromSource([definitionTypesDefinitionType], definitionSources, function(err, definitions) {
		if (err) { callback({ message : "Error loading definition types", error : err }); } else {
			var definitionTypeDefs = definitions[definitionTypesDefinitionType.name];
			var definitionTypes = [];
			definitionTypeDefs.forEach(function(definitionType) {
				definitionTypes.push(definitionType.definition);
			});
			callback(null, definitionTypes);
		}
	});
}

function loadDefinitionsFromSource(definitionTypes, definitionSources, callback) {
	var definitions = {};
	definitionTypes.forEach(function(definitionType) { definitions[definitionType.name] = []; });
	
	async.forEachSeries(definitionSources, function(definitionSource, nextEntry) {
		if (typeof(definitionSource) == "string") {
			console.log("Scanning folder for definitions : "+ definitionSource);
			loadDefinitionsFromFolder(definitionTypes, definitions, definitionSource, nextEntry);
		} else {
			nextEntry({ message : "Definition source type not recognised : "+ typeof(definitionSource) });
		}
	}, function(err) {
		if (err) { callback({ message : "Error loading definitions", error : err }); } else {
			callback(null, definitions);
		}
	});
}

function loadDefinitionsFromFolder(definitionTypes, definitions, definitionSource, callback) {
	walk.walk(definitionSource, {})
	.on("directory", function (root, dirStats, next) {
		next();
	})
	.on("files", function (root, filesStats, next) {
		async.forEachSeries(filesStats, function(fileStats, nextFileStats) {
			var fullname = path.join(definitionSource, fileStats.name);
			console.log("Loading definitions from file : "+ fullname);
			var module = null;
			try {
				module = require(fullname);
			} catch(e) {
				nextFileStats({ message : "Error loading definition module : "+ fullname, error : e.toString() });
				return;
			}
			loadDefinitionsFromModule(definitionTypes, definitions, module, function(err) {
				if (err) {nextFileStats(err);} else {
					nextFileStats();
				}
			});
		}, function(err) {
			if (err) { callback(err); } else {
				next();
			}
		});
	})
	.on("errors", function (root, nodeStatsArray, next) {
		callback({ message : "Error loading definitions files", fileStats : nodeStatsArray });
	})
	.on("end", function () { 
		// Need to make sure this is not called when error has been raised!!!
		callback();
	});
}

function loadDefinitionsFromModule(definitionTypes, definitions, module, callback) {
	async.forEachSeries(definitionTypes, function(definitionType, nextDefinitionType) {
		if (module.__.definitionType === definitionType.name) {
			console.log("Definition of type '"+ definitionType.toString() +"' found '"+ module.toString() +"'");
			definitions[definitionType.name].push({
				definitionType : definitionType,
				definition : module
			});
			callback();
		} else if (module instanceof Array) {
			async.forEachSeries(module, function(moduleItem, nextItem) {
				if (moduleItem[key].__.definitionType === definitionType.name) {
					definitions[definitionType.name].push({
						definitionType : definitionType,
						definition : moduleItem[key]
					});
				}
				nextItem();
			}, callback);
		} else {
			nextDefinitionType();
		}		
	}, callback);		
}
