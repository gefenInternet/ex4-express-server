var settings = require("./settings");
var path = require("path");

function checkSecurity(rootFolder, fullPath) {
	var relativeToRoot = path.relative(rootFolder, fullPath);
	if (relativeToRoot.indexOf("..") != -1) {
		throw settings.DEFAULT_ERROR;
	}
}

exports.checkSecurity = checkSecurity;