exports.LAST_REQUEST_TIMEOUT_SEC = 2;
exports.SEC_TO_MILISEC = 1000;

exports.httpType = {'.gif':'image/gif', '.jpg':'image/jpeg', '.png':'image/png', '.css':'text/css',
			'.html':'text/html', '.js':'application/javascript', '.txt':'text/plain','.ico':'image/vnd.microsoft.icon'};
		
exports.HTTP = "http";
exports.GET = "GET";
exports.POST = "POST";
exports.DELETE = "DELETE";
exports.PUT = "PUT";
exports.KEEP_ALIVE = "keep-alive";
exports.CONNECTION_CLOSE = "close";

exports.STATUS = "status";
exports.HTTP_ERROR = "400";
exports.FILE_NOT_FOUND_ERROR = "404";
exports.NOT_SUPPORTED =  "405";
exports.DEFAULT_ERROR = "500";
exports.PROBLEMATIC_VERSION = "1.0";

exports.ERROR_HTML_PATH = "\\errorPages\\error.html";
exports.STATUS_HTML_PATH = "\\statusPages\\status.html";