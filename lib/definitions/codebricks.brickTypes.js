var ce = require("cloneextend"), async = require("async");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.DefinitionType("BrickTypes", cb.internal.types.brickTypes.BrickTypeDefinition, function(env) {
	var self = this;
	
	var repositories = [];
	
	self.registerRepository = registerRepository;
	self.getBrickType = getBrickType;
	self.createBrick = createBrick;
	self.getBrick = getBrick;
	self.saveBrick = saveBrick;
	self.deserializeBrick = deserializeBrick;
	self.deinitialiseBrick = deinitialiseBrick;
	self.assertValidBrick = assertValidBrick;
	
	function registerRepository(repositoryBrick, callback) {
		repositories.push({
			brick : repositoryBrick
		});
		callback();
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
			repositoryBrick.get({ id : options.id, depth : options.depth, resolveCache : options.resolveCache, brickContext : options.brickContext }, function(err, brick) {
				if (err) { callback({ message : "Error getting brick id '"+ options.id +"'", error : err, stack : new Error().stack }); } else {
					callback(null, brick);
				}
			});
		}
	}
	
	function saveBrick(options, callback) {
		if (repositories.length == 0) { callback({ message : "No repository brick registered." }) } else {
			var repositoryBrick = repositories[0].brick;
			repositoryBrick.save({ brick : options.brick, depth : options.depth, persistedBricks : options.persistedBricks }, callback);
		}
	}
	
	function deserializeBrick(options, callback) {
		var brickJson = options.brickJson;
		assertValidBrick({ brick : brickJson }, function(err) {
			if (err) { callback(err); } else {
				getBrickType({ brickTypeId : brickJson.__.brickTypeId }, function(err, brickType) {
					if (err) { callback(err); } else {
						brickType.deserializeBrick({ brickJson : brickJson}, function(err, brick) {
							if (err) {callback(err);} else {														
								var depth = options.depth || false;
								if (depth === true) { depth = -Infinity; }
								if (depth === false) { depth = 0; }
								
								if (depth === -Infinity || depth > 0) {
									// needs to be resolve all properties!!!
									// need to remove call to deserialize brick, shouldn't be called here, probably from codebrick property type
									if (options.brickContext !== undefined) {
										brick.__.context = options.brickContext;
									}
									resolveProperties({ brick : brick, depth : (depth === -Infinity ? depth : depth - 1), resolveCache : options.resolveCache }, function(err) {
										if (err) {callback(err);} else {
											convertToAutoRefreshBrick({ brick : brick }, callback);
										}
									});
								} else {
									convertToAutoRefreshBrick({ brick : brick }, callback);
								}
							}
						});
					}
				});
			}
		});
	}
	
	function deinitialiseBrick(options, callback) {	
		getBrickType({ brickTypeId : options.brick.__.brickTypeId }, function(err, brickType) {
			if (err) { callback(err); } else {
				brickType.deinitialiseBrick({ brick : options.brick, depth : options.depth, persistedBricks : options.persistedBricks }, function(err, brickJson) {
					if (err) {callback(err);} else {
						callback(null, brickJson);
					}
				});
			}
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
	/* Needs to become resolve all properties, can get rid of getReferencedBrick method */
	function resolveProperties(options, callback) {			
		var resolveCache = options.resolveCache || { codebrick : {} };
		resolveCache.codebrick[options.brick.__.id] = options.brick;
		
		getBrickType({ brickTypeId : options.brick.__.brickTypeId }, function(err, brickType) {
			if (err) { callback(err); } else {
				brickType.forEachProperty({ brick : options.brick }, function(propItem, nextProperty) {
					brickType.forEachPropertyValue({ property : propItem.property, value : propItem.value }, function(propValue, nextPropValue) {
						env.methods.BrickPropertyTypes.resolveProperty({ brick : options.brick, property : propItem.property, value : propValue.value, depth : options.depth, resolveCache : resolveCache }, function(err, resolvedValue) {					
							if (err) { nextPropValue(err); } else {
								nextPropValue(null, resolvedValue);
							}
						});
					}, function(err, finalValue) {
						if (err) { nextProperty(err); } else {
							propItem.brickType.setPropertyValue(options.brick, propItem.name, finalValue);
							nextProperty();
						}
					});
				}, function(err) {
					if (err) { callback(err); } else { 
						options.brick.__.resolved = true;
						callback();
					}
				});
			};
		});
	}
	
	function convertToAutoRefreshBrick(options, callback) {
		var autoRefreshBrick = options.brick;
		getBrickType({ brickTypeId : autoRefreshBrick.__.brickTypeId }, function(err, brickType) {
			if (err) { callback(err); } else {
				brickType.forEachMember({ type : "methods" }, function(member, nextMember) {
					var memberName = member.name;
					var realMethod = brickType.getMemberValue(autoRefreshBrick, memberName);
					var autoRefreshMethod = function(options, callback, executionContext) {
						if (executionContext !== undefined) {
							realMethod.apply(executionContext, [options, callback]);
						} else {
							env.log("info", "Method '"+ autoRefreshBrick.__.id +"."+ memberName +"' being invoked. Refreshing brick...");
							getBrick({ id : autoRefreshBrick.__.id, depth : 1, brickContext : this.__.context }, function(err, freshBrick) {
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