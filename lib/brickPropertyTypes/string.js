var cb = require("../codebricks.js");

module.exports = new cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition("string", function(env) {
	var self = this;

	self.serialize = serialize;
	self.deserialize = deserialize;
	
	function serialize(options, callback) {
		var value = options.value;
		callback(null, value);
	}
	
	function deserialize(options, callback) {
		var value = options.value;
		callback(null, value);
	}
});