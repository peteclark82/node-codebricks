var cb = require("../codebricks.js");


module.exports = new cb.internal.types.DefinitionType("BrickPropertyTypes", cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition, function(env) {
	var self = this;
	
	self.initialise = initialise;
	self.deinitialise = deinitialise;
		
	function initialise(options, callback) {
		getPropertyType({ type : options.property.type}, function(err, propertyType) {
			if (err) {callback(err);} else {
				if (propertyType.initialise === undefined) {
					callback(null, options.value);
				} else {
					propertyType.initialise({ params : options.property.params, value : options.value, batch : options.batch }, function(err, value) {
						if (err) { callback(err); } else { 
							callback(null, value);
						}
					});
				}
			}
		});
	}
		
	function deinitialise(options, callback) {
		getPropertyType({ type : options.property.type}, function(err, propertyType) {
			if (err) {callback(err);} else {
				if (propertyType.deinitialise === undefined) {
					callback(null, options.value);
				} else {
					propertyType.deinitialise({ params : options.property.params, value : options.value, batch : options.batch }, function(err, value) {
						if (err) { callback(err); } else { callback(null, value); }
					});
				}
			}
		});
	}
		
	/* Private Functions */
	function getPropertyType(options, callback) {
		env.methods.DefinitionTypes.getDefinition("BrickPropertyTypes", options.type, function(err, definition) {
			if (err) { callback(err); } else {
				var propertyType = definition.createPropertyType(env);					
				callback(null, propertyType);
			}
		});
	}
});