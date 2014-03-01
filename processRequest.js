var settings = require("./settings");
var url = require("url");
var request = require('./request');
var queryString = require('./querystring');

function parseData(data, socket){
    var httpRequest = new request.Request(socket);
    var firstBreak = data.indexOf("\r\n\r\n");
    //check if header is finished. if not, don't process.
    if (firstBreak == -1) {
        return (httpRequest);
    }

    var header = data.substring(0,firstBreak);
    var other = data.substring(firstBreak+4);

    //if header is finished:
    try {
        var headerLines = header.split('\n');
        var firstLine = headerLines[0].split(' ');
        httpRequest.method = firstLine[0]; //GET/POST
        firstLine[2] = firstLine[2].split('/'); //protocol info
        httpRequest.protocol = firstLine[2][0].toLowerCase(); //HTTP
        httpRequest.httpVersion = firstLine[2][1]; //http version
        var tempRequest = firstLine[1].split('?');
        //var urlPath = url.parse(tempRequest[0], true); //before ?
        var urlPath = url.parse(firstLine[1], true);
        httpRequest.path = urlPath.pathname;
        httpRequest.url = urlPath.pathname;
        httpRequest.query = queryString.parse(tempRequest[1]);
       // httpRequest.params = tempRequest[1]; //after ?
        for (var i = 1; i < headerLines.length; i++){
            var headerPart = headerLines[i].split(':');
            httpRequest._addHeaderLine(headerPart[0].trim(), headerPart[1].trim(), httpRequest.headers);
        }
        httpRequest.connection = httpRequest.get('connection');
        if (httpRequest.host.indexOf(":") != -1){
            httpRequest.host = httpRequest.get('host').split(':')[0];
        }
        if (httpRequest.get('port') != undefined){
            httpRequest.port = httpRequest.get('port');
        }
        else if (httpRequest.host.indexOf(":") != -1){
            httpRequest.port = httpRequest.get('host').split(':')[1];
        }
        httpRequest.contentLength = httpRequest.get('content-length');
    } catch(e) {
        //remains undefined
    }
    //check which connection is it.
//    try {
//        var con = header.match(/((Connection:){1}.+)/)[0].split(' ');
//        httpRequest.connection = con[1];
//        httpRequest.headers['connection'] = httpRequest.connection;
//    } catch (e) {
//        httpRequest.connection = undefined;
//    }

//    try {
//        var host = header.match(/((Host:){1}.+)/)[0].split(' ');
//        httpRequest.host = host[1].split(':')[0];
//        httpRequest.port = host[1].split(':')[1];
//    } catch (e) {
//        httpRequest.host = undefined;
//        httpRequest.port = undefined;
//    }

//    try {
//        var contentType = header.match(/((Content-Type:){1}.+)/)[0].split(' ');
//        contentType = contentType[1].split(';')[0];
//        httpRequest.headers['content-type'] = contentType;
//    } catch (e) {
//    }


//    var len;
//    try {
//        len = (header.match(/((Content-Length){1}.*)/)[0].split(':'))[1];
//        len = parseInt(len);
//        httpRequest.headers['content-length'] = len;
//    } catch (e) {
//        len = undefined;
//    }



    if (httpRequest.contentLength == undefined) {
        httpRequest.finish = true;
        httpRequest.leftOvers = other;
        httpRequest.body = undefined;
        return (httpRequest);
    } else {
        if (other.length >= httpRequest.contentLength) {
            httpRequest.body = other.substring(0,httpRequest.contentLength);
            httpRequest.leftOvers = other.substring(httpRequest.contentLength);
            httpRequest.finish = true;
        }
        else if(other.length == httpRequest.contentLength){
            httpRequest.body = other;
            httpRequest.finish = true;
        }
        else {
            httpRequest.finish = false;
        }
    }
    return httpRequest;
}


/* parse the data and check that it all OK */
function processData(data, socket){

	var prcData = parseData(data, socket);
	if (prcData.finish == true) {
		if ((prcData.method == null) || (prcData.protocol == null) || (prcData.httpVersion == null) || (prcData.path == null)) {
			throw settings.DEFAULT_ERROR;
		}
		
		if(prcData.protocol !== settings.HTTP)
		{
			throw settings.HTTP_ERROR;
		}
		else if(prcData.method.toUpperCase() !== settings.GET && prcData.method.toUpperCase() !== settings.POST
            && prcData.method.toUpperCase() !== settings.PUT && prcData.method.toUpperCase() !== settings.DELETE)
		{
			throw settings.NOT_SUPPORTED;
		}
		
		if ((prcData.httpVersion.trim() === settings.PROBLEMATIC_VERSION) && (prcData.connection == undefined || prcData.connection.toLowerCase() !== settings.KEEP_ALIVE))
		{
			prcData.closeConnection = true;
		}
		else if((prcData.connection != undefined) && (prcData.connection.toLowerCase() === settings.CONNECTION_CLOSE))
		{
			prcData.closeConnection = true;
		}
	}
		
	return prcData;
}

exports.processData = processData;