module.exports = DefinitionType;

/* DefinitionType */
function DefinitionType(name, type, methods) {
	var self = this;
	
	self.name = name;
	self.type = type;
	self.methods = methods;
	
	self.toString = function() {
		return name;
	};
}