var cb = require("../codebricks.js");


module.exports = new cb.internal.types.DefinitionType("BrickPropertyTypes", cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition, function(env) {
	var self = this;
	
	self.serialize = serialize;
	self.deserialize = deserialize;
	self.getReferencedBrick = getReferencedBrick;
		
	function serialize(options, callback) {
		getPropertyType({ type : options.propertyType.type}, function(err, propertyType) {
			if (err) {callback(err);} else {
				propertyType.serialize({ value : options.value }, function(err, value) {
					if (err) { callback(err); } else { callback(null, value); }
				});
			}
		});
	}
	
	function deserialize(options, callback) {
		getPropertyType({ type : options.propertyType.type}, function(err, propertyType) {
			if (err) {callback(err);} else {	
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
		getPropertyType({ type : options.type.type}, function(err, propertyType) {
			if (err) {callback(err);} else {	
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
	
	/* Private Functions */
	function getPropertyType(options, callback) {
		env.getDefinition(cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition, options.type, function(err, definition) {
			if (err) { callback(err); } else {
				var propertyType = definition.createPropertyType(env);					
				callback(null, propertyType);
			}
		});
	}
});