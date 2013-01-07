var ce = require("cloneextend");
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

	self.createBrickType = function() {
		var brickType = new BrickType(self, constructor);
		return brickType;
	}
}

/* BrickType */
function BrickType(definition, constructor) {
	var self = this;
	
	var brickTypeBuilder = new BrickTypeBuilder();
	constructor.apply(self, [null, brickTypeBuilder]);
		
	self.__ = buildSummary(self);
	self.getMember = getMember;
	self.createInstance = createInstance;
	self.getPropertyType = getPropertyType;
	self.getPropertyValue = getPropertyValue;
	self.setPropertyValue = setPropertyValue;
		
	function getMember(context, propPath) {
		var propPathParts = propPath.split(".");
		while (propPathParts.length > 1) {
			var pathPart = propPathParts.shift();
			context = context[pathPart];
		}
		var key = propPathParts[0];
		
		return { context : context, key : key };
	}
		
	function createInstance(env, callback) {
		var brickInstanceBuilder = new BrickInstanceBuilder();
		var brick = new constructor(env, brickInstanceBuilder);
		brick.__ = {
			id : uuid.v4(),
			brickTypeId : definition.id
		};
		callback(null, brick);
	}
	
	function getPropertyType(propPath) {
		var prop = getMember(self, propPath);
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
function BrickTypeBuilder() {
	var self = this;
	
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

function BrickTypeProperty(options) {
	var self = this;
	
	self.mode = options.mode;
	self.type = options.type;
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
}