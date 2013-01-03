var async = require("async"), fs = require("fs"), path = require("path");

var cbi = require("./codebricks.internal.js");

module.exports = {
	loadDefinitions : loadDefinitions,
	getDefinitionType : getDefinitionType
};

/* Public Methods */
function loadDefinitions(definitionSources, callback) {
	console.log("Loading definition types...");
	loadDefinitionTypes(definitionSources, function(err, definitionTypes) {
		if (err) { callback(err); } else {
			console.log("...finished loading definition types");
			console.log("Loading definitions...");
			loadDefinitionsFromSource(definitionTypes, definitionSources, function(err, definitions) {
				if (err) { callback({ message : "Error loading definitions", error : err }); } else {
					console.log("...finished loading definitions");
					callback(null, {
						definitionTypes : definitionTypes,
						definitions : definitions
					});
				}
			});
		}
	})
}

function getDefinitionType(definitions, definitionType, typeId, callback) {
	var definitionsForType = definitions[definitionType];
	if (definitionsForType === undefined) {
		callback({ message : "Definition type not registered : "+ definitionType.name });
	} else {
		for(var i=0; i<definitionsForType.length; i++) {
			if (definitionsForType[i].definition.id === typeId) {
				callback(null, definitionsForType[i].definition);
				return;
			}
		}
		callback({ message : "Definition type '"+ definitionType.name +"' id not found : "+ typeId, definitionType : definitionType });
	}
}

/* Private Functions */
function loadDefinitionTypes(definitionSources, callback) {
	loadDefinitionsFromSource([{ name : "DefinitionType", type : cbi.types.DefinitionType }], definitionSources, function(err, definitions) {
		if (err) { callback({ message : "Error loading definition types", error : err }); } else {
			var definitionTypeDefs = definitions[cbi.types.DefinitionType];
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
	definitionTypes.forEach(function(definitionType) { definitions[definitionType.type] = []; });
	
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
		if (module instanceof definitionType.type) {
			console.log("Definition of type '"+ definitionType.name +"' found '"+ module.name +"'");
			definitions[definitionType.type].push({
				definitionType : definitionType,
				definition : module
			});
			callback();
		} else if (module instanceof Array) {
			async.forEachSeries(module, function(moduleItem, nextItem) {
				if (moduleItem[key] instanceof definitionType.type) {
					definitions[definitionType.type].push({
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
