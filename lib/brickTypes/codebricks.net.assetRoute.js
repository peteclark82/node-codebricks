var express = require("express"), async = require("async"), path = require("path"), send = require("send");
var cb = require("../codebricks.js");


module.exports = new cb.internal.types.brickTypes.BrickTypeDefinition("AssetRoute", "codebricks.net.assetRoute", function(env, builder) {
	var self = this;
	
	self.url = builder.defineProperty({ type : "regex" });
	self.path = builder.defineProperty({ type : "string" });
	self.onRequest = builder.defineMethod(onRequest);
		
	function onRequest(options, callback) {
		var req = options.request, res = options.response;
		
		if (self.url === undefined) { callback(null, false); } else {
			var match = self.url.exec(req.url);
			if (match == null) { callback(null, false); } else {
				var basePath = path.resolve(process.cwd(), self.path);
				var fileurl = match[1];
				send(req, fileurl)
				.root(basePath)
				.on('error', error)
				.on('directory', redirect)
				.pipe(res);
			}
		}
		
		function error(err) {
			res.statusCode = err.status || 500;
			res.end(err.message);
		}

		function redirect() {
			res.statusCode = 301;
			res.setHeader('Location', req.url + '/');
			res.end('Redirecting to ' + req.url + '/');
		}
	}
});