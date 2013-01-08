var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition("regex", function(env) {
	var self = this;

	self.serialize = serialize;
	self.deserialize = deserialize;
	
	function serialize(options, callback) {
		if (options.value === undefined) {
			callback(null, undefined);
		} else {
			var value = { 
				"pattern" : options.value.source,
				"flags" : 
					(options.value.ignoreCase ? "i" : "") +
					(options.value.global ? "g" : "") +
					(options.value.multiline ? "m" : "")
			};
			callback(null, value);
		}
	}
	
	function deserialize(options, callback) {
		if (options.value === undefined) {
			callback(null, undefined);
		} else {
			var value = new RegExp(options.value.pattern, options.value.flags);
			callback(null, value);
		}
	}
});