module.exports = {
	BrickPropertyTypeDefinition : BrickPropertyTypeDefinition
};

/* BrickPropertyTypeDefinition */
function BrickPropertyTypeDefinition(id, constructor) {
	var self = this;
	self.id = id;

	self.createPropertyType = function(env) {
		var brickPropertyType = new constructor(env);
		return brickPropertyType;
	}
	self.toString = function() {
		return id;
	};
}