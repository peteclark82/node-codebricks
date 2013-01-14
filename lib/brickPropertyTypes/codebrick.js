var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition("codebrick", function(env) {
	var self = this;

	self.initialise = initialise;
	self.deinitialise = deinitialise;
	self.serialize = serialize;
	self.deserialize = deserialize;
	self.resolveProperty = resolveProperty;
	self.assertValid = assertValid;
	
	function initialise(options, callback) {
		var brick = options.value;
		var interfaces = options.params.implements || [];
		if (interfaces.length == 0) {
			//should raise error if no interfaces defined!				
			callback(null, brick);
		} else {
			if (brick === undefined) {
				callback(null, brick);
			} else {
				env.methods.BrickInterfaces.getInterfacedBrick({ brick : brick, interfaces : interfaces }, callback);
			}
		}
	}
	
	function deinitialise(options, callback) {
		var brick = options.value;
		var interfaces = options.params.implements || [];
		if (interfaces.length == 0) {
			//should raise error if no interfaces defined!				
			callback(null, brick);
		} else {
			callback(null, brick.___);
		}
	}
	
	function serialize(options, callback) {
		if (options.value === undefined) {
			callback(null, undefined);
		} else {
			var value = { 
				"__" : { 
					"id" : options.value.__.id
				}
			};
			callback(null, value);
		}
	}
	
	function deserialize(options, callback) {
		if (options.value === undefined) {
			callback(null, undefined);
		} else {
			var brick = options.value;
			callback(null, brick);
		}
	}
		
	function resolveProperty(options, callback) {
		if (options.value === undefined) {
			callback();
		} else {
			var value = options.value;
			env.methods.BrickTypes.getBrick({ id : options.value.__.id, depth : options.depth }, function(err, brick) {
				if (err) {callback(err);} else {
					brick.__.context = options.brick.__.context;
					callback(null, brick);
				}
			});
		}
	}
	
	function assertValid(options, callback) {
		if (options.value === undefined) {
			callback();
		} else {
			env.methods.BrickTypes.assertValidBrick({ brick : options.value }, callback)
		}
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