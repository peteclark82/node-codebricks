module.exports = {
	BrickPropertyTypeDefinition : BrickPropertyTypeDefinition
};

/* BrickPropertyTypeDefinition */
function BrickPropertyTypeDefinition(id, constructor) {
	var self = this;
	self.__ = { definitionType : "BrickPropertyTypes" };
	self.toString = function() {
		return id;
	};
	
	self.id = id;

	self.createPropertyType = function(env) {
		var brickPropertyType = new constructor(env);
		return brickPropertyType;
	}
}