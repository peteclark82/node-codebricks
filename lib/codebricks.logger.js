var colors = require("colors");

module.exports = {
	log : log
};

function log(type, message) {
	var color = null;
	var formattedType = "[" + type + "] ";
	var formattedMessage = null;
	
	var stack = new Error().stack;
	var callerRe = /(\s+at.+(\(.+\)))\n|(\s+at\s(.+))\n/g;
	var callers = [];
	var match = callerRe.exec(stack);
	while(match !== null) {
		var filename = match[2];
		if (filename === undefined) { 
			filename = "("+ match[4] +")";
		}
		callers.push(filename);
		match = callerRe.exec(stack);
	}
	
	var formattedCaller = "\n--> "+ callers[1];
	
	switch (type) {
		case "info" :
			formattedMessage = (formattedType + message + formattedCaller).grey;
			break;
		case "data" :
			formattedMessage = (formattedType +"** Start **").yellow.bold + formattedCaller.yellow +"\n";
			formattedMessage += message +"\n";
			formattedMessage += (formattedType +"** End **").yellow.bold + formattedCaller.yellow +"\n";
			break;
		case "error" :
			formattedMessage = (formattedType +"** Start **").red.bold + formattedCaller.red +"\n" ;
			formattedMessage += message +"\n";
			formattedMessage += (formattedType +"** End **").red.bold + formattedCaller.red +"\n";
			break;
		case "event" :
			formattedMessage = (formattedType + message.bold +  formattedCaller).cyan.bold;
			break;
		default : 
			formattedMessage = formattedType + message + formattedCaller;
			break;
	}
			
	if (type === "error") {
		console.error(formattedMessage);
	} else {
		console.log(formattedMessage);
	}		
}