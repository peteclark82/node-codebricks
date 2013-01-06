var ce = require("cloneextend"), async = require("async");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.DefinitionType("BrickTypeDefinition", cb.internal.types.brickTypes.BrickTypeDefinition, function(env) {
	var self = this;
	
	var repositories = [];
	
	self.registerRepository = registerRepository;
	self.createBrick = createBrick;
	self.getBrick = getBrick;
	self.saveBrick = saveBrick;
	self.serializeBricks = serializeBricks;
	self.deserializeBrick = deserializeBrick;
	
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
				var brick = brickType.createInstance(env);
				callback(null, brick);
			}
		});
	}
	
	function getBrick(options, callback) {
		if (repositories.length == 0 && options.repositoryBrick === undefined) { callback({ message : "No repository brick registered." }) } else {
			var repositoryBrick = options.repositoryBrick || repositories[0].brick;
			if (options.deep !== true) {
				repositoryBrick.get({ id : options.id }, callback);
			} else {
				var resolvedBricks = options.resolvedBricks || {};
				if (resolvedBricks[options.id]) {
					callback(null, resolvedBricks[options.id]);
				} else {
					repositoryBrick.get({ id : options.id }, function(err, brick) {
						if (err) { callback(err); } else {
							resolvedBricks[options.id] = brick;
							loadReferencedBricks({ brick : brick, deep : options.deep, resolvedBricks : resolvedBricks }, function(err) {
								if (err) {callback(err);} else {
									callback(null, brick);
								}
							});
						}
					});
				}
			}
		}
	}
	
	function saveBrick(options, callback) {
		if (repositories.length == 0) { callback({ message : "No repository brick registered." }) } else {
			var repositoryBrick = repositories[0].brick;
			repositoryBrick.save({ brick : options.brick, deep : options.deep }, callback);
		}
	}
	
	function serializeBricks(options, callback) {	
		serializeBrick(options.brick, function(err, brickJson) {
			if (err) {callback(err);} else {
				if (options.deep !== true) {
					callback(null, [brickJson]);
				} else {
					var serializedBrickIds = options.serializedBrickIds || {};
					var serializedBricks = options.serializedBricks || [];
					if (serializedBrickIds[options.brick.__.id] !== undefined) {
						callback();
					} else {
						console.log(options.brick.__.id);
						serializedBricks.push(brickJson);
						serializedBrickIds[options.brick.__.id] = true;
						getAllReferencedBricks({ brick : options.brick }, function(err, bricks) {
							async.forEachSeries(bricks, function(brick, nextBrick) {
								serializeBricks({ brick : brick, deep : options.deep, serializedBricks : serializedBricks, serializedBrickIds : serializedBrickIds }, nextBrick);
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
		
	function deserializeBrick(brickJson, callback) {
		var brickTypeId = brickJson.__.brickTypeId;
		createBrick(brickTypeId, function(err, brick) {
			if (err) {callback(err);} else {
				ce.extend(brick, brickJson);
				loopBrickProperties({ brick : brick }, function(prop, nextProperty) {
					loopBrickPropertyValues({ type : prop.type, value : prop.value }, function(propValue, nextPropValue) {
						env.methods.BrickPropertyTypeDefinition.deserialize({ propertyType : prop.type, value : propValue.value }, function(err, deserializedValue) {
							if (err) { nextPropValue(err); } else {
								nextPropValue(null, deserializedValue);
							}
						});
					}, function(err, finalValue) {
						if (err) { nextProperty(err); } else {
							brick[prop.name] = finalValue;
							nextProperty();
						}
					});
				}, function(err) {
					if (err) { callback(err); } else { 
						callback(null, brick);
					}
				});
			}
		});
	}
	
	/* Private Functions */
	function serializeBrick(brick, callback) {
		var brickJson = ce.clone(brick);
		delete brickJson.__.resolved;
		loopBrickProperties({ brick : brickJson }, function(prop, nextProperty) {
			loopBrickPropertyValues({ type : prop.type, value : prop.value }, function(propValue, nextPropValue) {
				env.methods.BrickPropertyTypeDefinition.serialize({ propertyType : prop.type, value : propValue.value }, function(err, serializedValue) {
					if (err) { nextPropValue(err); } else {
						nextPropValue(null, serializedValue);
					}
				});
			}, function(err, finalValue) {
				if (err) { nextProperty(err); } else {
					brickJson[prop.name] = finalValue;
					nextProperty();
				}
			});
		}, function(err) {
			if (err) { callback(err); } else { 
				callback(null, brickJson);
			}
		});
	}
	
	function loadReferencedBricks(options, callback) {	
		loopBrickProperties({ brick : options.brick }, function(prop, nextProperty) {
			loopBrickPropertyValues({ type : prop.type, value : prop.value }, function(propValue, nextPropValue) {
				env.methods.BrickPropertyTypeDefinition.getReferencedBrick({ type : propValue.type, value : propValue.value }, function(err, brick) {					
					if (err) { nextPropValue(err); } else {
						if (brick !== undefined) {
							getBrick({ id : propValue.value.__.id, deep : options.deep, resolvedBricks : options.resolvedBricks }, function(err, resolvedBrick) {
								if (err) { nextPropValue(err); } else {
									nextPropValue(null, resolvedBrick);
								}
							});
						} else {
							nextPropValue();
						}
					}
				});
			}, function(err, finalValue) {
				if (err) { nextProperty(err); } else {
					if (finalValue !== undefined) {
						options.brick[prop.name] = finalValue;
					}
					nextProperty();
				}
			});
		}, function(err) {
			if (err) { callback(err); } else { 
				callback();
			}
		});
	}

	function getAllReferencedBricks(options, callback) {	
		var referencedBricks = [];
		loopBrickProperties({ brick : options.brick }, function(prop, nextProperty) {
			loopBrickPropertyValues({ type : prop.type, value : prop.value }, function(propValue, nextPropValue) {
				env.methods.BrickPropertyTypeDefinition.getReferencedBrick({ type : propValue.type, value : propValue.value }, function(err, brick) {					
					if (err) { nextPropValue(err); } else {
						nextPropValue(null, brick);
					}
				});
			}, function(err, finalValue) {
				if (err) { nextProperty(err); } else {
					if (finalValue !== undefined) {
						referencedBricks = referencedBricks.concat(finalValue);
					}
					nextProperty();
				}
			});
		}, function(err) {
			if (err) { callback(err); } else { 
				callback(null, referencedBricks);
			}
		});
	}
	
	function loopBrickProperties(options, propertyCallback, callback) {
		env.getDefinition(cb.internal.types.brickTypes.BrickTypeDefinition, options.brick.__.brickTypeId, function(err, brickTypeDef) {
			if (err) {callback(err); } else {
				var brickType = brickTypeDef.createBrickType();
				async.forEachSeries(Object.keys(brickType.__.properties), function(key, nextProperty) {
					var propertyType = brickType[key];
					var propertyValue = options.brick[key];										
					propertyCallback({ name : key, type : propertyType, value : propertyValue }, nextProperty)
				}, function(err) { if (err) { callback(err); } else { callback(); } });	
			}
		});
	}
	
	function loopBrickPropertyValues(options, valueCallback, callback) {
		var propertyType = options.type;
		var propertyValue = options.value;
		var propertyValues = null;
		
		if (propertyType.mode === "single" || propertyType.mode == undefined) { propertyValues = [propertyValue]; }
		else if (propertyType.mode === "array") { propertyValues = propertyValue; }
		
		if (propertyValues === undefined || propertyValues === null) {
			callback({ message : "Property type mode not recognised : "+ propertyType.mode });
		} else {
			var values = [];
			async.forEachSeries(propertyValues, function(propertyValue, nextPropertyValue) {
				valueCallback({ type : propertyType, value : propertyValue }, function(err, value) {
					if (err) { nextPropertyValue(err); } else {
						if (value !== undefined) {
							values.push(value);
						}
						nextPropertyValue();
					}
				});
			}, function(err) {
				if (err) {callback(err);} else {
					var finalValue = null;
					if (propertyType.mode === "single" || propertyType.mode == undefined) { finalValue = values[0]; }
					else if (propertyType.mode === "array") { finalValue = values; }
					callback(null, finalValue);
				}									
			});								
		}
	}
});