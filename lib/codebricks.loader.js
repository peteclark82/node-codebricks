var async = require("async"), fs = require("fs"), path = require("path");

var cbi = require("./codebricks.internal.js");

module.exports = {
	loadDefinitions : loadDefinitions,
	getDefinitionType : getDefinitionType
};

/* Public Methods */
function loadDefinitions(definitionSources, callback) {
	console.log("Loading definition types...");
	loadDefinitionsFromSource([cbi.types.DefinitionType], definitionSources, function(err, definitions) {
		if (err) { callback({ message : "Error loading definition types", error : err }); } else {
			var definitionTypes = definitions[cbi.types.DefinitionType];
			definitionTypesArray = [];
			definitionTypes.forEach(function(definitionType) {
				definitionTypesArray.push(definitionType.type);
			});
			console.log("...finished loading definition types");
			console.log("Loading definitions...");
			loadDefinitionsFromSource(definitionTypesArray, definitionSources, function(err, definitions) {
				if (err) { callback({ message : "Error loading definitions", error : err }); } else {
					console.log("...finished loading definitions");
					callback(null, definitions);
				}
			});
		}
	});
}

function getDefinitionType(definitions, definitionType, typeId, callback) {
	var definitionsForType = definitions[definitionType];
	if (definitionsForType === undefined) {
		callback({ message : "Definition type not registered : "+ definitionType.name });
	} else {
		for(var i=0; i<definitionsForType.length; i++) {
			if (definitionsForType[i].id === typeId) {
				callback(null, definitionsForType[i]);
				return;
			}
		}
		callback({ message : "Definition type '"+ definitionType.name +"' id not found : "+ typeId, definitionType : definitionType });
	}
}

/* Private Functions */
function loadDefinitionsFromSource(definitionTypes, definitionSources, callback) {
	var definitions = {};
	definitionTypes.forEach(function(definitionType) { definitions[definitionType] = []; });
	
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
	fs.readdir(definitionSource, function(err, files) {
		if (err) {callback(err);} else {
			async.forEachSeries(files, function(file, nextFile) {
				var filename = path.join(definitionSource, file);
				fs.stat(filename, function(err, stats) {
					if (err) {nextFile(err);} else {
						if (stats.isFile()) {
							console.log("Loading definitions from file : "+ filename);
							var module = null;
							try {
								module = require(filename);
							} catch(e) {
								nextFile({ message : "Error loading definition module : "+ filename, error : e.toString() });
								return;
							}
							loadDefinitionsFromModule(definitionTypes, definitions, module, nextFile);
						}
					}
				});
			}, callback);
		}
	});
}

function loadDefinitionsFromModule(definitionTypes, definitions, module, callback) {
	async.forEachSeries(definitionTypes, function(definitionType, nextDefinitionType) {
		if (module instanceof definitionType) {
			console.log("Definition of type '"+ definitionType.name +"' found '"+ module.name +"'");
			definitions[definitionType].push(module);
			callback();
		} else if (module instanceof Array) {
			async.forEachSeries(module, function(moduleItem, nextItem) {
				if (moduleItem[key] instanceof definitionType) {
					definitions[definitionType].push(moduleItem[key]);
				}
				nextItem();
			}, callback);
		} else {
			nextDefinitionType();
		}		
	}, callback);		
}
