var ce = require("cloneextend"), async = require("async");


module.exports = {
	BrickInterfaceDefinition : BrickInterfaceDefinition,
	BrickInterface : BrickInterface
};

/* BrickInterfaceDefinition */
function BrickInterfaceDefinition(id, constructor) {
	var self = this;
	self.id = id;

	self.createBrickInterface = function() {
		var brickInterface = new BrickInterface(self, constructor);
		return brickInterface;
	};
	
	self.toString = function() {
		return id;
	};
}

/* BrickInterface */
function BrickInterface(definition, constructor) {
	var self = this;
	
	var members = {};
	self.interfaces = [];
	var brickInterfaceBuilder = new BrickInterfaceBuilder();
	constructor.apply(members, [null, brickInterfaceBuilder]);
	
	self.__ = buildSummary(members);
	
	self.getMember = getMember;
	self.createInterfacedBrick = createInterfacedBrick;
	self.getMemberValue = getMemberValue;
	self.setMemberValue = setMemberValue;
	self.forEachMember = forEachMember;
		
	function getMember(context, propPath) {
		var propPathParts = propPath.split(".");
		while (propPathParts.length > 1) {
			var pathPart = propPathParts.shift();
			context = context[pathPart];
		}
		var key = propPathParts[0];
		
		return { context : context, key : key };
	}
		
	function createInterfacedBrick(options, callback) {	
		var interfacedBrick = {};
		forEachMember({ type : "methods" }, function(member, nextMember) {
			var memberName = member.name;
			var method = getMemberValue(options.brick, memberName);
			setMemberValue(interfacedBrick, memberName, method);
			nextMember();
		}, function(err) {
			if (err) { callback(err); } else {
				forEachMember({ type : "properties" }, function(member, nextMember) {
					var memberName = member.name;
					var propertyValue = getMemberValue(options.brick, memberName);
					setMemberValue(interfacedBrick, memberName, propertyValue);
					nextMember();
				}, function(err) {
					if (err) { callback(err); } else {
						interfacedBrick.__ = options.brick.__;
						interfacedBrick.___ = options.brick;
						callback(null, interfacedBrick);
					}
				});
			}
		});
	}
	
	function getMemberValue(instance, memberPath) {
		var member = getMember(instance, memberPath);
		return member.context[member.key];
	}
	
	function setMemberValue(instance, memberPath, value) {
		var member = getMember(instance, memberPath);
		member.context[member.key] = value;
	}
	
	function forEachMember(options, memberCallback, callback) {
		var membersOfType = self.__[options.type];
		async.forEachSeries(Object.keys(membersOfType), function(memberName, nextMember) {
			var member = membersOfType[memberName];
			memberCallback({ name : memberName, member : member, brickType : self }, nextMember)
		}, callback);	
	}
	
	/* Private Functions */
	function buildSummary(obj, keyPrefix) {
		var summary = {
			properties : {},
			methods : {}
		};
		Object.keys(obj).forEach(function(key) {
			var member = obj[key];
			var fullKey = (keyPrefix !== undefined ? keyPrefix+"." : "") + key;
			if (member instanceof BrickInterfaceProperty) {
				summary.properties[fullKey] = member;
			} else if (member instanceof BrickInterfaceMethod) {
				summary.methods[fullKey] = member;
			} else if (typeof(member) == "object"){
				var nestedSummary = buildSummary(member, fullKey);
				ce.extend(summary, nestedSummary);
			}
		});
		return summary;
	}	
}

function BrickInterfaceProperty(options) {
	var self = this;
	
	self.mode = options.mode;
	self.type = options.type;
	self.params = options;
}

function BrickInterfaceMethod(options) {
	var self = this;	
}

/* BrickInterfaceBuilder */
function BrickInterfaceBuilder(interfaces) {
	var self = this;
	
	self.defineProperty = function(options) {
		return new BrickInterfaceProperty(options);
	};
		
	self.defineMethod = function(options) {
		return new BrickInterfaceMethod(options);
	};
}