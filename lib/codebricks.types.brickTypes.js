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
	constructor.apply(self, [brickTypeBuilder]);
		
	self.__ = buildSummary(self);
	self.createInstance = createInstance;
	self.getPropertyType = getPropertyType;
	self.getPropertyValue = getPropertyValue;
	self.setPropertyValue = setPropertyValue;
			
	function createInstance(env, proto) {
		var brickInstanceBuilder = new BrickInstanceBuilder();
		var brick = new constructor(brickInstanceBuilder, env);
		brick.__ = {
			id : uuid.v4(),
			brickTypeId : definition.id
		};
		ce.extend(brick, proto);
		return brick;
	}
	
	function getPropertyType(propPath) {
		var prop = getProperty(self, propPath);
		return prop.context[prop.key];
	}
	
	function getPropertyValue(instance, propPath) {
		var prop = getProperty(instance, propPath);
		return prop.context[prop.key];
	}
	
	function setPropertyValue(instance, propPath, value) {
		var prop = getProperty(instance, propPath);
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
				var nestedSummary = buildSummary(member, key);
				ce.extend(summary, nestedSummary);
			}
		});
		return summary;
	}
	
	function getProperty(instance, propPath) {
		var context = instance;
		var propPathParts = propPath.split(".");
		while (propPathParts.length > 1) {
			var pathPart = propPathParts.shift();
			context = context[pathPart];
		}
		var key = propPathParts[0];
		
		return { context : context, key : key };
	}
}

/* BrickInstanceBuilder */
function BrickInstanceBuilder() {
	var self = this;
	
	self.defineState = function(options) {
		return new BrickInstanceState(options);
	};
	
	self.defineProperty = function(options) {
		return options.defaultValue || ( options.mode == "array" ? [] : undefined );
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
}

function BrickTypeMethod(method) {
}