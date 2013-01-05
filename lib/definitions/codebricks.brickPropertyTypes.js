var cb = require("../codebricks.js");

module.exports = new cb.internal.types.DefinitionType("BrickPropertyTypeDefinition", cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition, function(env) {
	var self = this;
	
	self.serialize = serialize;
	self.deserialize = deserialize;
	
	function serialize(options, callback) {
		env.getDefinition(cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition, options.propertyType.type, function(err, definition) {
			if (err) { callback(err); } else {
				var propertyType = definition.createPropertyType(env);					
				propertyType.serialize({ value : options.value }, function(err, value) {
					if (err) { callback(err); } else { callback(null, value); }
				});
			}
		});
	}
	
	function deserialize(options, callback) {
		env.getDefinition(cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition, options.propertyType.type, function(err, definition) {
			if (err) { callback(err); } else {
				var propertyType = definition.createPropertyType(env);					
				propertyType.deserialize({ value : options.value }, function(err, value) {
					if (err) { callback(err); } else { callback(null, value); }
				});
			}
		});
	}
});