var cb = require("../codebricks.js");

module.exports = new cb.internal.types.brickInterfaces.BrickInterfaceDefinition("codebricks.net.IHttpService", function(env, builder) {
	var self = this;

	self.initialise = builder.defineMethod({});
});