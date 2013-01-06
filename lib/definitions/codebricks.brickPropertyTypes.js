var cb = require("../codebricks.js");

module.exports = new cb.internal.types.DefinitionType("BrickPropertyTypeDefinition", cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition, function(env) {
	var self = this;
	
	self.serialize = serialize;
	self.deserialize = deserialize;
	self.getReferencedBrick = getReferencedBrick;
	
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
					if (err) { callback(err); } else { 
						if (propertyType.assertValid === undefined || value === undefined) {
							callback(null, value);
						} else {
							propertyType.assertValid({ value : value }, function(err) {
								if (err) { callback(err); } else {
									callback(null, value);
								}
							});
						}
					}
				});
			}
		});
	}
	
	function getReferencedBrick(options, callback) {
		env.getDefinition(cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition, options.type.type, function(err, definition) {
			if (err) { callback(err); } else {
				var propertyType = definition.createPropertyType(env);					
				if (propertyType.getReferencedBrick === undefined) {
					callback();
				} else {	
					propertyType.getReferencedBrick({ value : options.value }, function(err, brick) {
						if (err) { callback(err); } else {
							callback(null, brick);
						}
					});
				}
			}
		});
	}
});