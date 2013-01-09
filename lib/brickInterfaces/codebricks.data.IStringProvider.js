var cb = require("../codebricks.js");

module.exports = new cb.internal.types.brickInterfaces.BrickInterfaceDefinition("codebricks.data.IStringProvider", function(env, builder) {
	var self = this;

	self.getString = builder.defineMethod({});
});