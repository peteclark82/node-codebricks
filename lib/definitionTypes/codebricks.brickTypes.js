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
		getBrick({ id : id, batch : { context : options.context, depth : 1 } }, function(err, brick) {
			if (env.guard(err, "Error getting brick for isolate : "+ id, err, callback)) { return; }
			callback(null, brick);
		});
	}
	
	function getBrickType(options, callback) {
		env.methods.DefinitionTypes.getDefinition("BrickTypes", options.brickTypeId, function(err, brickTypeDef) {
			if (err) { callback(err); } else {
				var brickType = brickTypeDef.createBrickType(env);
				callback(null, brickType);
			}
		});
	}
	
	function createBrick(brickTypeId, callback) {
		env.methods.DefinitionTypes.getDefinition("BrickTypes", brickTypeId, function(err, brickTypeDef) {
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
			repositoryBrick.get({ id : options.id, batch : options.batch }, function(err, brick) {
				if (err) { callback({ message : "Error getting brick id '"+ options.id +"'", error : err, stack : new Error().stack }); } else {
					callback(null, brick);
				}
			});
		}
	}
	
	function saveBrick(options, callback) {
		if (repositories.length == 0) { callback({ message : "No repository brick registered." }) } else {
			if (options.brick._ === undefined || options.brick._.initialised !== true) {
				callback();
			} else {
				var repositoryBrick = repositories[0].brick;
				repositoryBrick.save({ brick : options.brick, batch : options.batch }, callback);
			}
		}
	}
	
	function initialiseBrick(options, callback) {		
		var brickJson = options.brickJson;
		assertValidBrick({ brick : brickJson }, function(err) {
			if (env.guard(err, callback)) {return;}
			getBrickType({ brickTypeId : brickJson.__.brickTypeId }, function(err, brickType) {
				if (env.guard(err, callback)) {return;}
				var batch = {
					context : (options.batch && options.batch.context ? options.batch.context : {}),
					depth : getDepth(options.batch && options.batch.depth ? getDepth(options.batch.depth) : false),
					initialisedBricks : (options.batch && options.batch.initialisedBricks ? options.batch.initialisedBricks : {})
				};

				brickType.initialiseBrick({ brickJson : brickJson, batch : batch}, function(err, brick) {
					if (env.guard(err, callback)) {return;}
					convertToAutoRefreshBrick({ brick : brick, batch : batch }, callback);
				});
			});
		});
	}
	
	function deinitialiseBrick(options, callback) {		
		getBrickType({ brickTypeId : options.brick.__.brickTypeId }, function(err, brickType) {
			if (env.guard(err, callback)) {return;}
			var batch = {
				context : (options.batch && options.batch.context ? options.batch.context : {}),
				depth : getDepth(options.batch && options.batch.depth ? getDepth(options.batch.depth) : false),
				persistedBricks : (options.batch && options.batch.persistedBricks ? options.batch.persistedBricks : {})
			};
			
			brickType.deinitialiseBrick({ brick : options.brick, batch : batch }, function(err, brickJson) {
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
		var context = options.batch.context;
		
		var autoRefreshBrick = options.brick;
		getBrickType({ brickTypeId : autoRefreshBrick.__.brickTypeId }, function(err, brickType) {
			if (err) { callback(err); } else {
				brickType.forEachMember({ type : "methods" }, function(member, nextMember) {
					var memberName = member.name;
					var realMethod = brickType.getMemberValue(autoRefreshBrick, memberName);
					var autoRefreshMethod = function(refreshedMethodOptions, callback, executionContext) {
						if (executionContext !== undefined) {
							executionContext._.context = context;
							realMethod.apply(executionContext, [refreshedMethodOptions, callback]);
						} else {
							env.log("info", "Method '"+ autoRefreshBrick.__.id +"."+ memberName +"' being invoked. Refreshing brick...");
							getBrick({ id : autoRefreshBrick.__.id, batch : { depth : 1, context : context } }, function(err, freshBrick) {
								if (err) { callback(err); } else {
									var method = brickType.getMemberValue(freshBrick, memberName);
									method(refreshedMethodOptions, callback, freshBrick);
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