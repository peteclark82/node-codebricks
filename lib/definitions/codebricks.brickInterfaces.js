var async = require("async"), ce = require("cloneextend");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.DefinitionType("BrickInterfaces", cb.internal.types.brickInterfaces.BrickInterfaceDefinition, function(env) {
	var self = this;
	
	self.getInterfacedBrick = getInterfacedBrick;
		
	function getInterfacedBrick(options, callback) {
		var finalInterfacedBrick = {};
		env.getDefinitions(cb.internal.types.brickInterfaces.BrickInterfaceDefinition, options.interfaces, function(err, definitions) {
			if (err) { callback(err); } else {
				async.forEachSeries(definitions, function(definition, nextDefinition) {
					var brickInterface = definition.createBrickInterface();			
					env.log("info", "Applying interface '"+ definition.toString() +"' to brick '"+ options.brick.__.id +"'");
					brickInterface.createInterfacedBrick({ brick : options.brick }, function(err, interfacedBrick) {
						if (err) {nextDefinition(err);} else {
							ce.extend(finalInterfacedBrick, interfacedBrick);
							nextDefinition();
						}
					});
				}, function(err) {
					if (err) {callback(err);} else {
						callback(null, finalInterfacedBrick);
					}
				});
			}
		});
	}
});