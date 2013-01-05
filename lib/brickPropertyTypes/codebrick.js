var cb = require("../codebricks.js");

module.exports = new cb.internal.types.brickPropertyTypes.BrickPropertyTypeDefinition("codebrick", function(env) {
	var self = this;

	self.serialize = serialize;
	self.deserialize = deserialize;
	
	function serialize(options, callback) {
		if (options.value === undefined) {
			callback(null, undefined);
		} else {
			console.log(options);
			var value = { 
				"__" : { 
					"id" : options.value.__.id
				}
			};
			callback(null, value);
		}
	}
	
	function deserialize(options, callback) {
		if (options.value === undefined) {
			callback(null, undefined);
		} else {
			var value = options.value;
			callback(null, value);
		}
	}
});