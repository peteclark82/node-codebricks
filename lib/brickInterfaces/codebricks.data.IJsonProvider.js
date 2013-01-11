var cb = require("../codebricks.js");

module.exports = new cb.internal.types.brickInterfaces.BrickInterfaceDefinition("codebricks.data.IJsonProvider", function(env, builder) {
	var self = this;

	self.getJson = builder.defineMethod({});
});