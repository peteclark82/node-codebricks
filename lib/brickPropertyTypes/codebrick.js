var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition("codebrick", function(env) {
	var self = this;

	self.initialise = initialise;
	self.deinitialise = deinitialise;
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
		var interfaces = options.params.implements || [];
		var brick = options.value;
		//should raise error if no interfaces defined!?!?!		
		brick = (brick !== undefined && interfaces.length > 0) ? brick.___ : brick;
		
		if (brick === undefined) {
			callback(null, undefined);
		} else {
			var brickJson = { 
				"__" : { 
					"id" : brick.__.id
				}
			};
			
			var depth = options.depth || false;
			if (depth === true) { depth = -Infinity; }
			if (depth === false) { depth = 0; }

			if ((depth === -Infinity || depth > 0) && options.persistedBricks[brick.__.id] === undefined) {
				env.methods.BrickTypes.saveBrick({ brick : brick, depth : (depth === -Infinity ? depth : depth - 1), persistedBricks : options.persistedBricks }, function(err) {
					if (err) {callback(err);} else { 
						callback(null, brickJson);
					}
				});
			} else {
				callback(null, brickJson);
			}
		}
	}
	
	function resolveProperty(options, callback) {
		if (options.value === undefined) {
			callback();
		} else {
			var value = options.value;
			var id = options.value.__.id;
			var alreadyResolvedBrick = options.resolveCache.codebrick[id];
			if (alreadyResolvedBrick !== undefined) {
				//overwriting an already resolved bricks context seems very wrong!!
				alreadyResolvedBrick.__.context = options.brick.__.context;
				callback(null, alreadyResolvedBrick);
			} else {
				env.methods.BrickTypes.getBrick({ id : options.value.__.id, depth : options.depth, resolveCache : options.resolveCache }, function(err, brick) {
					if (err) {callback(err);} else {
						brick.__.context = options.brick.__.context;
						callback(null, brick);
					}
				});
			}
		}
	}
	
	/*
	function unresolveProperty(options, callback) {
		if (options.value === undefined) {
			callback();
		} else {
			var value = options.value;
			var id = options.value.__.id;
			var alreadyUnresolvedBrick = options.unresolveCache.codebrick[id];
			if (alreadyUnresolvedBrick !== undefined) {
				callback();
			} else {
				env.methods.BrickTypes.saveBrick({ id : options.value, depth : options.depth, unresolveCache : options.unresolveCache }, function(err) {
					if (err) {callback(err);} else {
						callback();
					}
				});
			}
		}
	}
	*/
	
	function assertValid(options, callback) {
		if (options.value === undefined) {
			callback();
		} else {
			env.methods.BrickTypes.assertValidBrick({ brick : options.value }, callback)
		}
	}
	
	/* Private Functions */
	function deserialize(options, callback) {
		if (options.value === undefined) {
			callback(null, undefined);
		} else {
			var brick = options.value;
			callback(null, brick);
		}
	}
	
	function getPropertyType(options, callback) {
		env.getDefinition(cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition, options.type, function(err, definition) {
			if (err) { callback(err); } else {
				var propertyType = definition.createPropertyType(env);					
				callback(null, propertyType);
			}
		});
	}
});