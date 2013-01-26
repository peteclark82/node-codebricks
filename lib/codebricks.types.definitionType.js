module.exports = DefinitionType;

/* DefinitionType */
function DefinitionType(name, type, methods) {
	var self = this;
	self.__ = { definitionType : "DefinitionTypes" };
	self.toString = function() {
		return name;
	};
	
	self.name = name;
	self.type = type;
	self.methods = methods;
}