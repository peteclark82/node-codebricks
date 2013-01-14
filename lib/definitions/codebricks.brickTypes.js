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
	self.serializeBrick = serializeBrick;
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
			repositoryBrick.get({ id : options.id, depth : options.depth, brickContext : options.brickContext }, function(err, brick) {
				if (err) { callback({ message : "Error getting brick id '"+ options.id +"'", error : err, stack : new Error().stack }); } else {
					callback(null, brick);
				}
			});
		}
	}
	
	function saveBrick(options, callback) {
		if (repositories.length == 0) { callback({ message : "No repository brick registered." }) } else {
			var repositoryBrick = repositories[0].brick;
			repositoryBrick.save({ brick : options.brick, depth : options.depth }, callback);
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
									var resolvedBricks = options.resolvedBricks || {};
									if (resolvedBricks[options.id] !== undefined) {
										callback(null, resolvedBricks[options.id]);
									} else {
										resolvedBricks[options.id] = brick;
										// needs to be resolve all properties!!!
										// need to remove call to deserialize brick, shouldn't be called here, probably from codebrick property type
										if (options.brickContext !== undefined) {
											brick.__.context = options.brickContext;
										}
										resolveProperties({ brick : brick, depth : (depth === -Infinity ? depth : depth - 1) }, function(err) {
											if (err) {callback(err);} else {
												convertToAutoRefreshBrick({ brick : brick }, callback);
											}
										});
									}
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
	
	function serializeBrick(options, callback) {	
		getBrickType({ brickTypeId : options.brick.__.brickTypeId }, function(err, brickType) {
			if (err) { callback(err); } else {
				brickType.serializeBrick({ brick : options.brick}, function(err, brickJson) {
					if (err) {callback(err);} else {
						if (options.depth !== true) {
							callback(null, [brickJson]);
						} else {
							var serializedBrickIds = options.serializedBrickIds || {};
							var serializedBricks = options.serializedBricks || [];
							if (serializedBrickIds[options.brick.__.id] !== undefined) {
								callback();
							} else {
								serializedBricks.push(brickJson);
								serializedBrickIds[options.brick.__.id] = true;
								getAllReferencedBricks({ brick : options.brick }, function(err, bricks) {
									if (err) { callback(err); } else {
										async.forEachSeries(bricks, function(brick, nextBrick) {
											if (brick.__.resolved !== true) { nextBrick(); } else {
												serializeBrick({ brick : brick, depth : options.depth, serializedBricks : serializedBricks, serializedBrickIds : serializedBrickIds }, nextBrick);
											}
										}, function(err) {
											if (err) {callback(err);} else {
												callback(null, serializedBricks);
											}
										});
									}
								});
							}
						}
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
		getBrickType({ brickTypeId : options.brick.__.brickTypeId }, function(err, brickType) {
			if (err) { callback(err); } else {
				brickType.forEachProperty({ brick : options.brick }, function(propItem, nextProperty) {
					brickType.forEachPropertyValue({ property : propItem.property, value : propItem.value }, function(propValue, nextPropValue) {
						env.methods.BrickPropertyTypes.resolveProperty({ brick : options.brick, property : propItem.property, value : propValue.value, depth : options.depth }, function(err, resolvedValue) {					
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
	
	function getAllReferencedBricks(options, callback) {	
		var referencedBricks = [];
		getBrickType({ brickTypeId : options.brick.__.brickTypeId }, function(err, brickType) {
			if (err) { callback(err); } else {
				brickType.forEachProperty({ brick : options.brick }, function(propItem, nextProperty) {
					brickType.forEachPropertyValue({ property : propItem.property, value : propItem.value }, function(propValue, nextPropValue) {
						//this feels wrong, need to find a better abstraction!
						env.methods.BrickPropertyTypes.getReferencedBrick({ type : propItem.property.type, value : propValue.value }, function(err, brick) {					
							if (err) { nextPropValue(err); } else {
								if (brick === undefined) {
									nextPropValue();
								} else {
									env.methods.BrickPropertyTypes.deinitialise({ property : propItem.property, value : brick }, function(err, deinitialisedBrick) {
										if (err) { nextPropValue({ message : "Error initialising property '"+ propItem.name + "' on brick id '"+ brick.__.id +"'", error : err }); } else {
											referencedBricks.push(deinitialisedBrick);
											nextPropValue();
										}
									});
								}
							}
						});
					}, nextProperty);
				}, function(err) {
					if (err) { callback(err); } else { 
						callback(null, referencedBricks);
					}
				});
			}
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