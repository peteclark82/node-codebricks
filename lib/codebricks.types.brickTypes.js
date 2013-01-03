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
		var brickTypeBuilder = new BrickTypeBuilder();
		constructor.apply(brickType, [brickTypeBuilder]);
		return brickType;
	}
}

/* BrickType */
function BrickType(definition, constructor) {
	var self = this;
	
	self.createInstance = createInstance;
	
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
}

/* BrickInstanceBuilder */
function BrickInstanceBuilder() {
	var self = this;
	
	self.defineState = function(options) {
		return new BrickInstanceState(options);
	};
	
	self.defineProperty = function(options) {
		return options.defaultValue;
	};
	
	self.defineArrayProperty = function(options) {
		return [];
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
	
	self.defineArrayProperty = function(options) {
		return new BrickTypeProperty(options, true);
	};
	
	self.defineMethod = function(method) {
		return new BrickTypeMethod(method);
	};
}

function BrickTypeState(options) {
	var self = this;
	
	self.isVolatile = options.isVolatile;
}

function BrickTypeProperty(options, isArray) {
	var self = this;
	
	self.isArray = isArray;
	self.type = options.type;
}

function BrickTypeMethod(method) {
}