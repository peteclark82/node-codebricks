var ce = require("cloneextend"), async = require("async");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.DefinitionType("BrickTypes", cb.internal.types.brickTypes.BrickTypeDefinition, function(env) {
	var self = this;
	
	var repositories = [];
	
	self.registerRepository = registerRepository;
	self.isolate = isolate;
	self.getBrickType = getBrickType;
	self.createBrick = createBrick;
	self.getBrick = getBrick;
	self.saveBrick = saveBrick;
	self.initialiseBrick = initialiseBrick;
	self.deinitialiseBrick = deinitialiseBrick;
	self.assertValidBrick = assertValidBrick;
	
	function registerRepository(repositoryBrick, callback) {
		repositories.push({
			brick : repositoryBrick
		});
		callback();
	}
	
	function isolate(options, callback) {
		var id = options.brick.__.id;
		getBrick({ id : id, context : options.context, depth : 1 }, function(err, brick) {
			if (env.guard(err, "Error getting brick for isolate : "+ id, err, callback)) { return; }
			callback(null, brick);
		});
	}
	
	function getBrickType(options, callback) {
		env.getDefinition(cb.internal.types.brickTypes.BrickTypeDefinition, options.brickTypeId, function(err, brickTypeDef) {
			if (err) { callback(err); } else {
				var brickType = brickTypeDef.createBrickType(env);
				callback(null, brickType);
			}
		});
	}
	
	function createBrick(brickTypeId, callback) {
		env.getDefinition(cb.internal.types.brickTypes.BrickTypeDefinition, brickTypeId, function(err, brickTypeDef) {
			if (err) {callback(err); } else {
				var brickType = brickTypeDef.createBrickType(env);
				brickType.createInstance({}, function(err, brick) {
					if (err) {callback(err);} else {
						callback(null, brick);
					}
				});
			}
		});
	}
	
	function getBrick(options, callback) {
		if (repositories.length == 0) { callback({ message : "No repository brick registered." }) } else {
			var repositoryBrick = repositories[0].brick;
			env.log("info", "Getting brick '"+ options.id +"'...");
			repositoryBrick.get({ id : options.id, context : options.context, depth : options.depth, initialisedBricks : options.initialisedBricks }, function(err, brick) {
				if (err) { callback({ message : "Error getting brick id '"+ options.id +"'", error : err, stack : new Error().stack }); } else {
					callback(null, brick);
				}
			});
		}
	}
	
	function saveBrick(options, callback) {
		if (repositories.length == 0) { callback({ message : "No repository brick registered." }) } else {
			if (options.brick.__.initialised !== true) {
				callback();
			} else {
				var repositoryBrick = repositories[0].brick;
				repositoryBrick.save({ brick : options.brick, depth : options.depth, persistedBricks : options.persistedBricks }, callback);
			}
		}
	}
	
	function initialiseBrick(options, callback) {		
		var brickJson = options.brickJson;
		assertValidBrick({ brick : brickJson }, function(err) {
			if (env.guard(err, callback)) {return;}
			getBrickType({ brickTypeId : brickJson.__.brickTypeId }, function(err, brickType) {
				if (env.guard(err, callback)) {return;}
				brickType.initialiseBrick({ brickJson : brickJson, context : options.context, depth : getDepth(options.depth), initialisedBricks : options.initialisedBricks}, function(err, brick) {
					if (env.guard(err, callback)) {return;}
					convertToAutoRefreshBrick({ brick : brick, context : options.context }, callback);
				});
			});
		});
	}
	
	function deinitialiseBrick(options, callback) {		
		getBrickType({ brickTypeId : options.brick.__.brickTypeId }, function(err, brickType) {
			if (env.guard(err, callback)) {return;}
			brickType.deinitialiseBrick({ brick : options.brick, depth : getDepth(options.depth), persistedBricks : options.persistedBricks }, function(err, brickJson) {
				if (env.guard(err, callback)) {return;}
				callback(null, brickJson);
			});
		});
	}
			
	function assertValidBrick(options, callback) {
		var brick = options.brick;
		var isValid = brick !== undefined && brick.__ !== undefined && brick.__.id !== undefined;
		if (isValid === false) {
			callback({ message : "The supplied data is not a valid codebrick", _data : brick });
		} else {
			callback();
		}
	}
	
	/* Private Functions */	
	function getDepth(depth) {
		depth = depth || false;
		if (depth === true) { depth = -Infinity; }
		if (depth === false) { depth = 0; }
		return depth;
	}
	
	function convertToAutoRefreshBrick(options, callback) {
		var context = options.context;
		
		var autoRefreshBrick = options.brick;
		getBrickType({ brickTypeId : autoRefreshBrick.__.brickTypeId }, function(err, brickType) {
			if (err) { callback(err); } else {
				brickType.forEachMember({ type : "methods" }, function(member, nextMember) {
					var memberName = member.name;
					var realMethod = brickType.getMemberValue(autoRefreshBrick, memberName);
					var autoRefreshMethod = function(options, callback, executionContext) {
						if (executionContext !== undefined) {
							executionContext.__.context = context;
							realMethod.apply(executionContext, [options, callback]);
						} else {
							env.log("info", "Method '"+ autoRefreshBrick.__.id +"."+ memberName +"' being invoked. Refreshing brick...");
							getBrick({ id : autoRefreshBrick.__.id, depth : 1, context : context }, function(err, freshBrick) {
								if (err) { callback(err); } else {
									var method = brickType.getMemberValue(freshBrick, memberName);
									method(options, callback, freshBrick);
								}
							})
						}
					};
					brickType.setMemberValue(autoRefreshBrick, memberName, autoRefreshMethod);
					nextMember();
				}, function(err) {
					if (err) { callback(err); } else {
						callback(null, autoRefreshBrick);
					}
				});
			}
		});
	}
});