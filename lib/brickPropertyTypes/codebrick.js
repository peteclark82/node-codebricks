var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition("codebrick", function(env) {
	var self = this;

	self.initialise = initialise;
	self.deinitialise = deinitialise;
	
	function initialise(options, callback) {
		//should raise error if no interfaces defined!?!?!		
		var interfaces = options.params.implements || [];
		var brick = options.value;
		
		if (brick === undefined) {
			callback(null, undefined);
		} else {		
			var depth = options.depth;
			if (depth === -Infinity || depth > 0) {
				if (options.initialisedBricks[brick.__.id] !== undefined) {
					var alreadyInitialisedBrick = options.initialisedBricks[brick.__.id];
					env.methods.BrickInterfaces.getInterfacedBrick({ brick : alreadyInitialisedBrick.___ || alreadyInitialisedBrick, interfaces : interfaces }, callback);
				} else {
					env.methods.BrickTypes.getBrick({ id : brick.__.id, context : options.context, depth : (depth === -Infinity ? depth : depth - 1), initialisedBricks : options.initialisedBricks }, function(err, initialisedBrick) {
						if (err) {callback(err);} else { 
							env.methods.BrickInterfaces.getInterfacedBrick({ brick : initialisedBrick, interfaces : interfaces }, callback);
						}
					});
				}
			} else {
				callback(null, brick);
			}
		}
	}
		
	function deinitialise(options, callback) {
		//should raise error if no interfaces defined!?!?!		
		var interfaces = options.params.implements || [];
		var brick = options.value;
				
		if (brick === undefined) {
			callback(null, undefined);
		} else {
			var brickJson = {  "__" : { "id" : brick.__.id } };
			
			var depth = options.depth;
			if (depth === -Infinity || depth > 0) {
				if (options.persistedBricks[brick.__.id] !== undefined) {
					callback(null, brickJson);
				} else {
					brick = ((brick !== undefined && interfaces.length > 0) && brick.___ !== undefined) ? brick.___ : brick;
					
					env.methods.BrickTypes.saveBrick({ brick : brick, depth : (depth === -Infinity ? depth : depth - 1), persistedBricks : options.persistedBricks }, function(err) {
						if (err) {callback(err);} else { 
							callback(null, brickJson);
						}
					});
				}
			} else {
				callback(null, brickJson);
			}
		}
	}
});