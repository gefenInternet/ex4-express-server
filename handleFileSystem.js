var dynamic = require("./dynamic");
var securityChecks = require("./securityChecks");
var settings = require("./settings");
var fs = require("fs");
var path = require("path");
var error = require("./errorFile");


/* send the file of the pathName received to the socket */
function getFile(fullPath, rootFolder, response, closeAfter) {

    var newPath = fullPath.replace("%20", ' ');
    try{
	    securityChecks.checkSecurity(rootFolder, newPath);
    }
    catch(err){
        handleErrorAndStatus(settings.DEFAULT_ERROR, response.socket, closeAfter);
        return;
    }
	
	//check the status of the file
	fs.stat(newPath, function(err, stats) {
		//file not found
		if (stats == undefined) {
			handleErrorAndStatus(settings.FILE_NOT_FOUND_ERROR,response.socket, closeAfter);
			return;
		}
		fs.readFile(newPath, "binary", function(err, data) {
            if (err && err.code === "EISDIR"){
                handleErrorAndStatus(settings.FILE_NOT_FOUND_ERROR,response.socket, closeAfter);
                return;
            }
            response.set('Content-Type',settings.httpType[path.extname(newPath)]);
            response.send(data);
		});
	});
	
}

function handleErrorAndStatus(e, socket, closeAfter){
 //   try{
        var errorResponse = dynamic.requestError(error.htmlError, e);
        if (socket != undefined){
            socket.write("HTTP/1.1 " + e + " OK\r\nContent-Type: text/html\r\nContent-Length: " + errorResponse.length + "\r\n\r\n");
            socket.write(errorResponse);
            if (closeAfter == true) {
                socket.end();
            }
        }
        else{
            console.log('socket/response is undefined');
        }
}



exports.getFile = getFile;
exports.handleErrorAndStatus = handleErrorAndStatus;