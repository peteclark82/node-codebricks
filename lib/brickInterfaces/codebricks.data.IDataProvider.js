var cb = require("../codebricks.js");

module.exports = new cb.internal.types.brickInterfaces.BrickInterfaceDefinition("codebricks.data.IDataProvider", function(env, builder) {
	var self = this;

	self.getData = builder.defineMethod({});
});