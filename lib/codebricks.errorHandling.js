module.exports = {
	guard : guard
};

function guard() {
	var args = Array.prototype.slice.apply(arguments);
	var condition = args.shift();
	var error = args.length > 1 ? args.shift() : condition;
	var innerException = args.length > 1 ? args.shift() : undefined;
	var callback = args.shift();
	
	if (condition) {
		var errorObj = {};
		if (error instanceof Error) {
			errorObj.message = error.message;
			errorObj.stack = error.stack;
		} else if (typeof(error) == "string") {
			errorObj.message = error;
			errorObj.stack = new Error().stack;
		} else {
			errorObj.message = JSON.stringify(error, null, 2);
			errorObj.stack = new Error().stack;
			errorObj.innerException = innerException;
		}
		callback(errorObj);
		return true;
	} else {
		return false;
	}		
}