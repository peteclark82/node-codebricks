var ce = require("cloneextend"), async = require("async");
var uuid = require('node-uuid');


module.exports = {
	BrickTypeDefinition : BrickTypeDefinition,
	BrickType : BrickType
};

/* BrickTypeDefinition */
function BrickTypeDefinition(name, id, constructor) {
	var self = this;
	self.name = name;
	self.id = id;

	self.createBrickType = function(env) {
		var brickType = new BrickType(env, self, constructor);
		return brickType;
	};
	
	self.toString = function() {
		return id;
	};
}

/* BrickType */
function BrickType(env, definition, constructor) {
	var self = this;
	
	var members = {};
	self.interfaces = [];
	var brickTypeBuilder = new BrickTypeBuilder(self.interfaces);
	constructor.apply(members, [null, brickTypeBuilder]);
	
	self.__ = buildSummary(members);

	self.getMember = getMember;
	self.createInstance = createInstance;
	self.getProperty = getProperty;
	self.getPropertyValue = getPropertyValue;
	self.setPropertyValue = setPropertyValue;
	self.getMemberValue = getMemberValue;
	self.setMemberValue = setMemberValue;
	self.initialiseBrick = initialiseBrick;
	self.deinitialiseBrick = deinitialiseBrick;
	self.forEachMember = forEachMember;
	self.forEachPropertyValue = forEachPropertyValue;
		
	function getMember(context, propPath) {
		var propPathParts = propPath.split(".");
		while (propPathParts.length > 1) {
			var pathPart = propPathParts.shift();
			context = context[pathPart];
		}
		var key = propPathParts[0];
		
		return { context : context, key : key };
	}
		
	function createInstance(options, callback) {
		var newBrickId = uuid.v4();
		var brickInstanceBuilder = new BrickInstanceBuilder(newBrickId, env);
		var brick = new constructor(env, brickInstanceBuilder);
		brick.__ = {
			id : newBrickId,
			brickTypeId : definition.id,
			brickType : self,
			context : new BrickContext(definition.id)
		};
		callback(null, brick);
	}
	
	function BrickContext(owner) {
		var context = {};
		this.get = get;
		this.set = set;
		this.owner = owner;
		
		function get(key) {
			return context[key];
		}
		function set(key, value) {
			context[key] = value;
		}
	}
	
	function getProperty(propPath) {
		var prop = getMember(members, propPath);
		return prop.context[prop.key];
	}
	
	function getPropertyValue(instance, propPath) {
		var prop = getMember(instance, propPath);
		return prop.context[prop.key];
	}
	
	function setPropertyValue(instance, propPath, value) {
		var prop = getMember(instance, propPath);
		prop.context[prop.key] = value;
	}
	
	function getMemberValue(instance, memberPath) {
		var member = getMember(instance, memberPath);
		return member.context[member.key];
	}
	
	function setMemberValue(instance, memberPath, value) {
		var member = getMember(instance, memberPath);
		member.context[member.key] = value;
	}
	
	function forEachMember(options, propertyCallback, callback) {
		var membersOfType = self.__[options.type];
		async.forEachSeries(Object.keys(membersOfType), function(memberName, nextMember) {
			var member = membersOfType[memberName];
			propertyCallback({ name : memberName, member : member, brickType : self }, nextMember)
		}, function(err) { if (err) { callback(err); } else { callback(); } });	
	}
		
	function forEachPropertyValue(options, valueCallback, callback) {
		var property = options.property;
		
		var initialValues = property.valueToArray({ value : options.value });
		var finalValues = property.getDefaultValueForMode();
		async.forEachSeries(initialValues, function(propertyValueItem, nextPropertyValue) {
			valueCallback({ property : property, value : propertyValueItem.value }, function(err, value) {
				if (err) { nextPropertyValue(err); } else {
					if (value !== undefined) {
						finalValues = property.setValue({ context : finalValues, key : propertyValueItem.key, value : value });
					}
					nextPropertyValue();
				}
			});
		}, function(err) {
			if (err) {callback(err);} else {
				var finalValue = property.isEmpty({ value : finalValues }) ? options.value : finalValues;
				callback(null, finalValue);
			}									
		});								
	}
	
	function initialiseBrick(options, callback) {
		createInstance({}, function(err, brick) {
			if (err) {callback(err);} else {
				ce.extend(brick, options.brickJson);
				
				var initialisedBricks = options.initialisedBricks || {};
				initialisedBricks[brick.__.id] = brick;

				forEachMember({ type : "properties" }, function(propItem, nextProperty) {
					var propertyValue = getPropertyValue(brick, propItem.name);
					forEachPropertyValue({ property : propItem.member, value : propertyValue }, function(propValue, nextPropValue) {
						env.methods.BrickPropertyTypes.initialise({ property : propItem.member, value : propValue.value, depth : options.depth, initialisedBricks : initialisedBricks }, function(err, initialisedValue) {
							if (err) { nextPropValue({ message : "Error initialising property '"+ propItem.name + "' on brick id '"+ brick.__.id +"'", error : err, _brickJson : options.brickJson }); } else {
								nextPropValue(null, initialisedValue);
							}
						});
					}, function(err, finalValue) {
						if (err) { nextProperty(err); } else {
							setPropertyValue(brick, propItem.name, finalValue);
							nextProperty();
						}
					});
				}, function(err) {
					if (err) { callback(err); } else { 
						brick.__.initialised = true;
						callback(null, brick);
					}
				});
			}
		});
	}
	
	function deinitialiseBrick(options, callback) {
		var brick = options.brick;
		var persistedBricks = options.persistedBricks || {};
		persistedBricks[brick.__.id] = true;
		
		var brickJson = { __ : ce.clone(brick).__ };
		delete brickJson.__.initialised;
		delete brickJson.__.brickType;
		delete brickJson.__.context;
		
		forEachMember({ type : "properties" }, function(propItem, nextProperty) {
			var propertyValue = getPropertyValue(brick, propItem.name);
			forEachPropertyValue({ property : propItem.member, value : propertyValue }, function(propValue, nextPropValue) {
				env.methods.BrickPropertyTypes.deinitialise({ property : propItem.member, value : propValue.value, depth : options.depth, persistedBricks : persistedBricks }, function(err, deinitialisedValue) {
					if (err) { nextPropValue(err); } else {
						nextPropValue(null, deinitialisedValue);
					}
				});
			}, function(err, finalValue) {
				if (err) { nextProperty(err); } else {
					setPropertyValue(brickJson, propItem.name, finalValue);
					nextProperty();
				}
			});
		}, function(err) {
			if (err) { callback(err); } else { 
				callback(null, brickJson);
			}
		});
	}
	
	/* Private Functions */
	function buildSummary(obj, keyPrefix) {
		var summary = {
			state : {},
			properties : {},
			methods : {}
		};
		Object.keys(obj).forEach(function(key) {
			var member = obj[key];
			var fullKey = (keyPrefix !== undefined ? keyPrefix+"." : "") + key;
			if (member instanceof BrickTypeState) {
				summary.state[fullKey] = member;
			} else if (member instanceof BrickTypeProperty) {
				summary.properties[fullKey] = member;
			} else if (member instanceof BrickTypeMethod) {
				summary.methods[fullKey] = member;
			} else if (typeof(member) == "object"){
				var nestedSummary = buildSummary(member, fullKey);
				ce.extend(summary, nestedSummary);
			}
		});
		return summary;
	}
}

/* BrickInstanceBuilder */
function BrickInstanceBuilder() {
	var self = this;
	
	self.implements = function(options) {};
	
	self.defineState = function(options) {
		return new BrickInstanceState(options);
	};
	
	self.defineProperty = function(options) {
		var brickTypeProperty = new BrickTypeProperty(options);
		return options.defaultValue || brickTypeProperty.getDefaultValueForMode();
	};
	
	self.defineMethod = function(method) {
		return method;
	};
}

function BrickInstanceState(options) {
	var self = this;
	var value = options.defaultValue;
	
	self.isVolatile = options.isVolatile;
	
	self.get = function(callback) {
		callback(null, value);
	};
	
	self.set = function(newValue, callback) {
		value = newValue;
		callback(null);
	};
}

/* BrickTypeBuilder */
function BrickTypeBuilder(interfaces) {
	var self = this;
	
	self.implements = function() {
		var args = Array.prototype.slice.apply(arguments);
		args.forEach(function(implementedInterface) {
			interfaces.push(new BrickTypeInterface(implementedInterface));
		});
	};
	
	self.defineState = function(options) {
		return new BrickTypeState(options);
	};
	
	self.defineProperty = function(options) {
		return new BrickTypeProperty(options, false);
	};
		
	self.defineMethod = function(method) {
		return new BrickTypeMethod(method);
	};
}

function BrickTypeState(options) {
	var self = this;
	
	self.isVolatile = options.isVolatile;
}

function BrickTypeInterface(options) {
	var self = this;
	
	self.type = options.type;
}

function BrickTypeProperty(options) {
	var self = this;
	
	self.mode = options.mode;
	self.type = options.type;
	self.params = options;
	self.setValue = setValue;
	self.valueToArray = valueToArray;
	self.isEmpty = isEmpty;
	self.getDefaultValueForMode = getDefaultValueForMode;
	
	function setValue(options) {
		var context = options.context;
		var key = options.key;
		var value = options.value;
		
		switch(self.mode) {
			case "array":
				context.push(value); break;
			case "hash":
				context[key] = value; break;
				break;
			case "single" : default:
				context = value; break;
		}
		return context;
	}
	
	function valueToArray(options) {
		var propertyValue = options.value;
		var valueArray = [];
		
		switch(self.mode) {
			case "array":
				if (propertyValue) {
					propertyValue.forEach(function(value, index) {
						valueArray.push({ key : index, value : value })
					});
				}
				break;
			case "hash":
				if (propertyValue) {
					Object.keys(propertyValue).forEach(function(key) {
						valueArray.push({ key : key, value : propertyValue[key] })
					});
				}
				break;
			case "single" : default:
				valueArray.push({ key : null, value : propertyValue })
				break;
		}
		return valueArray;
	}
	
	function isEmpty(options) {		
		var value = options.value;
		var isEmpty = true;
		switch(self.mode) {
			case "array":
				isEmpty = value.length == 0 ? true : false; 
				break;
			case "hash":
				isEmpty = Object.keys(value).length == 0 ? true : false;
				break;
			case "single" : default:
				isEmpty = value === undefined ? true : false;
				break;
		}
		return isEmpty;
	}
	
	function getDefaultValueForMode() {
		var defaultValue = undefined;
		
		switch(self.mode) {
			case "array":
				defaultValue = [];
				break;
			case "hash":
				defaultValue = {};
				break;
			case "single" : default:
				break;
		}
		return defaultValue;
	}
}

function BrickTypeMethod(method) {
	var self = this;
	
	self.method = method;
}