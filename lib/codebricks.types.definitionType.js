var ce = require("cloneextend");
var uuid = require('node-uuid');

module.exports = DefinitionType;

/* DefinitionType */
function DefinitionType(name, type) {
	var self = this;
	self.name = name;
	self.type = type;
}