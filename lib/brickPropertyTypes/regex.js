var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition("regex", function(env) {
	var self = this;

	self.initialise = initialise;
	self.deinitialise = deinitialise;
	
	function initialise(options, callback) {
		if (options.value === undefined) {
			callback(null, undefined);
		} else {
			var value = undefined;
			if (options.value && options.value.pattern) {
				value = new RegExp(options.value.pattern, options.value.flags);
			}
			callback(null, value);
		}
	}
	
	function deinitialise(options, callback) {
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
});