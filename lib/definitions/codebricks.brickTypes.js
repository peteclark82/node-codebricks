var ce = require("cloneextend"), async = require("async");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.DefinitionType("BrickTypes", cb.internal.types.brickTypes.BrickTypeDefinition, function(env) {
	var self = this;
	
	var repositories = [];
	
	self.registerRepository = registerRepository;
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
	
	function createBrick(brickTypeId, callback) {
		env.getDefinition(cb.internal.types.brickTypes.BrickTypeDefinition, brickTypeId, function(err, brickTypeDef) {
			if (err) {callback(err); } else {
				var brickType = brickTypeDef.createBrickType();
				brickType.createInstance(env, function(err, brick) {
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
			console.log("Getting brick '"+ options.id +"'...");
			repositoryBrick.get({ id : options.id, depth : options.depth, offline : options.offline }, function(err, brick) {
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
	
	function deserializeBrick(options, getBrickCallback, callback) {
		getBrickCallback({ id : options.id }, function(err, brickJson) {
			if (err) { callback(err); } else {
				deserializeSingleBrick(brickJson, function(err, brick) {
					if (err) {callback(err);} else {
						brick.__.resolved = true;
						
						var depth = options.depth || false;
						if (depth === true) { depth = -Infinity; }
						if (depth === false) { depth = 0; }

						if (depth === -Infinity || depth > 0) {
							var resolvedBricks = options.resolvedBricks || {};
							if (resolvedBricks[options.id] !== undefined) {
								callback(); //skip because already deserialized
							} else {
								resolvedBricks[options.id] = brick;
								resolveAllReferencedBricks({ brick : brick }, function(referencedBrick, nextBrick) {
									nextDepth = depth === -Infinity ? depth : depth - 1;
									deserializeBrick({ id : referencedBrick.__.id, depth : nextDepth, resolvedBricks : resolvedBricks }, getBrickCallback, function(err, resolvedBrick) {
										if (err) {
											nextBrick({ message : "Error resolving reference on brick id '"+ brick.__.id +"'", error : err });
										} else {
											nextBrick(null, resolvedBrick);
										}
									});
								}, function(err) {
									if (err) {callback(err);} else {
										callback(null, brick);
									}
								});
							}
						} else {
							callback(null, brick);
						}
					}
				});
			}
		});
	}
	
	function serializeBrick(options, callback) {	
		serializeSingleBrick(options.brick, function(err, brickJson) {
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
							async.forEachSeries(bricks, function(brick, nextBrick) {
								serializeBrick({ brick : brick, depth : options.depth, serializedBricks : serializedBricks, serializedBrickIds : serializedBrickIds }, nextBrick);
							}, function(err) {
								if (err) {callback(err);} else {
									callback(null, serializedBricks);
								}
							});
						});
					}
				}
			}
		});
	}
	
	function assertValidBrick(options, callback) {
		var brick = options.brick;
		var isValid = brick.__ !== undefined && brick.__.id !== undefined;
		if (isValid === false) {
			callback({ message : "The supplied data is not a valid codebrick", _data : brick });
		} else {
			callback();
		}
	}
	
	/* Private Functions */	
	function getBrickType(options, callback) {
		env.getDefinition(cb.internal.types.brickTypes.BrickTypeDefinition, options.brickTypeId, function(err, brickTypeDef) {
			if (err) { callback(err); } else {
				var brickType = brickTypeDef.createBrickType();
				callback(null, brickType);
			}
		});
	}
	
	function deserializeSingleBrick(brickJson, callback) {
		var brickTypeId = brickJson.__.brickTypeId;
		getBrickType({ brickTypeId : brickTypeId}, function(err, brickType) {
			if (err) { callback(err); } else {
				createBrick(brickTypeId, function(err, brick) {
					if (err) {callback(err);} else {
						ce.extend(brick, brickJson);
						brickType.forEachProperty({ brick : brick }, function(prop, nextProperty) {
							brickType.forEachPropertyValue({ type : prop.type, value : prop.value }, function(propValue, nextPropValue) {
								env.methods.BrickPropertyTypes.deserialize({ propertyType : prop.type, value : propValue.value }, function(err, deserializedValue) {
									if (err) { nextPropValue({ message : "Error deserializing property '"+ prop.name + "' on brick id '"+ brick.__.id +"'", error : err, _brickJson : brickJson }); } else {
										nextPropValue(null, deserializedValue);
									}
								});
							}, function(err, finalValue) {
								if (err) { nextProperty(err); } else {
									prop.brickType.setPropertyValue(brick, prop.name, finalValue);
									nextProperty();
								}
							});
						}, function(err) {
							if (err) { callback(err); } else { 
								convertToAutoRefreshBrick({ brick : brick }, callback);
							}
						});
					}
				});
			}
		});
	}
	
	function serializeSingleBrick(brick, callback) {
		var brickJson = ce.clone(brick);
		delete brickJson.__.resolved;
		deconstructBrick({ brick : brickJson }, function(err) {
			if (err) {callback(err);} else {
				getBrickType({ brickTypeId : brickJson.__.brickTypeId }, function(err, brickType) {
					if (err) { callback(err); } else {
						brickType.forEachProperty({ brick : brickJson }, function(prop, nextProperty) {
							brickType.forEachPropertyValue({ type : prop.type, value : prop.value }, function(propValue, nextPropValue) {
								env.methods.BrickPropertyTypes.serialize({ propertyType : prop.type, value : propValue.value }, function(err, serializedValue) {
									if (err) { nextPropValue(err); } else {
										nextPropValue(null, serializedValue);
									}
								});
							}, function(err, finalValue) {
								if (err) { nextProperty(err); } else {
									prop.brickType.setPropertyValue(brickJson, prop.name, finalValue);
									nextProperty();
								}
							});
						}, function(err) {
							if (err) { callback(err); } else { 
								callback(null, brickJson);
							}
						});
					}
				});
			}
		});
	}
	
	function deconstructBrick(options, callback) {
		env.getDefinition(cb.internal.types.brickTypes.BrickTypeDefinition, options.brick.__.brickTypeId, function(err, brickTypeDef) {
			if (err) {callback(err); } else {
				var brickType = brickTypeDef.createBrickType();
				Object.keys(brickType.__.state).forEach(function(key) {
					var member = brickType.getMember(options.brick, key);
					delete member.context[member.key];
				});
				Object.keys(brickType.__.methods).forEach(function(key) {
					var member = brickType.getMember(options.brick, key);
					delete member.context[member.key];
				});
				callback();
			}
		});
	}
	
	function resolveAllReferencedBricks(options, resolveCallback, callback) {	
		getBrickType({ brickTypeId : options.brick.__.brickTypeId }, function(err, brickType) {
			if (err) { callback(err); } else {
				brickType.forEachProperty({ brick : options.brick }, function(prop, nextProperty) {
					brickType.forEachPropertyValue({ type : prop.type, value : prop.value }, function(propValue, nextPropValue) {
						env.methods.BrickPropertyTypes.getReferencedBrick({ type : propValue.type, value : propValue.value }, function(err, nestedBrick) {					
							if (err) { nextPropValue(err); } else {
								if (nestedBrick === undefined) {
									nextPropValue();
								} else {
									resolveCallback(nestedBrick, nextPropValue);
								}
							}
						});
					}, function(err, finalValue) {
						if (err) { nextProperty(err); } else {
							if (finalValue !== undefined) {
								prop.brickType.setPropertyValue(options.brick, prop.name, finalValue);
							}
							nextProperty();
						}
					});
				}, function(err) {
					if (err) { callback(err); } else { 
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
				brickType.forEachProperty({ brick : options.brick }, function(prop, nextProperty) {
					brickType.forEachPropertyValue({ type : prop.type, value : prop.value }, function(propValue, nextPropValue) {
						env.methods.BrickPropertyTypes.getReferencedBrick({ type : propValue.type, value : propValue.value }, function(err, brick) {					
							if (err) { nextPropValue(err); } else {
								if (brick !== undefined) { referencedBricks.push(brick); }
								nextPropValue();
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
					var realMethod = autoRefreshBrick[memberName];
					autoRefreshBrick[memberName] = function(options, callback, isDirectCall) {
						if (isDirectCall === true) {
							realMethod(options, callback);
						} else {
							console.log("Refreshing brick, method '"+ autoRefreshBrick.__.id +"."+ memberName +"' being invoked...");
							getBrick({ id : autoRefreshBrick.__.id, depth : 1 }, function(err, freshBrick) {
								if (err) { callback(err); } else {
									freshBrick[memberName](options, callback, true);
								}
							})
						}
					};
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