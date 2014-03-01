var util = require('util');
var net = require('net');
var settings = require('./settings');
var processRequest = require("./processRequest");
var handleFileSystem = require("./handleFileSystem");
var OutgoingMessage = require('./outgoingMessage').OutgoingMessage;
var EventEmitter = require('events').EventEmitter;

var STATUS_CODES = exports.STATUS_CODES = {
    200 : 'OK',
    400 : 'Bad Request',
    403 : 'Forbidden',
    404 : 'Not Found',
    405 : 'Method Not Allowed',
    500 : 'Internal Server Error'
};

var CRLF = "\r\n";


function ServerResponse(req) {
    OutgoingMessage.call(this);
    this.req = req;

    if (req.method === 'HEAD') this._hasBody = false;

    this.sendDate = true;

}
util.inherits(ServerResponse, OutgoingMessage);


exports.ServerResponse = ServerResponse;

ServerResponse.prototype.statusCode = 200;
ServerResponse.prototype.statusMessage = undefined;

function onServerResponseClose() {
   // if (this._httpMessage) this._httpMessage.emit('close');
}

ServerResponse.prototype.assignSocket = function(socket) {
    socket._httpMessage = this;
  //  socket.on('close', onServerResponseClose);
    this.socket = socket;
    this.connection = socket;
};

ServerResponse.prototype._implicitHeader = function() {
    this.writeHead(this.statusCode);
};

ServerResponse.prototype.writeHead = function(statusCode) {
    var headers, headerIndex;

    if (typeof arguments[1] == 'string') {
        this.statusMessage = arguments[1];
        headerIndex = 2;
    } else {
        this.statusMessage =
            this.statusMessage || STATUS_CODES[statusCode] || 'unknown';
        headerIndex = 1;
    }
    this.statusCode = statusCode;

    var obj = arguments[headerIndex];

    if (obj && this._headers) {
        // Slow-case: when progressive API and header fields are passed.
        headers = this._renderHeaders();

        if (util.isArray(obj)) {
            // handle array case
            var field;
            for (var i = 0, len = obj.length; i < len; ++i) {
                field = obj[i][0];
                if (!util.isUndefined(headers[field])) {
                    obj.push([field, headers[field]]);
                }
            }
            headers = obj;

        } else {
            // handle object case
            var keys = Object.keys(obj);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                if (k) headers[k] = obj[k];
            }
        }
    } else if (this._headers) {
        // only progressive api is used
        headers = this._renderHeaders();
    } else {
        // only writeHead() called
        headers = obj;
    }

    var statusLine = 'HTTP/1.1 ' + statusCode.toString() + ' ' +
        this.statusMessage + CRLF;

    this._storeHeader(statusLine, headers);
};

ServerResponse.prototype.writeHeader = function() {
    this.writeHead.apply(this, arguments);
};

function Server(requestHandler){
    if (!(this instanceof Server)) return new Server(requestHandler);
    net.Server.call(this, { allowHalfOpen: true });
    if (requestHandler) {
        this.addListener('request', requestHandler);
    }

    this.addListener('connection', connectionHandler);

    this.addListener('clientError', function(err, conn) {
        conn.destroy(err);
    });


    this.setTimeout = function(msecs, callback) {
        this.timeout = msecs;
        if (callback)
            this.on('timeout', callback);
    };

    this.timeout = settings.LAST_REQUEST_TIMEOUT_SEC * 60 * settings.SEC_TO_MILISEC;
}


util.inherits(Server, net.Server);

exports.Server = Server;

function connectionHandler(socket){
    var self = this;
    var socketEnded = false;

    socket.setTimeout(settings.LAST_REQUEST_TIMEOUT_SEC*settings.SEC_TO_MILISEC, function() {
        socket.end();
    });
    var buffer = [];
    socket.on('data', socketOnData);


    function socketOnData(data) {
        buffer.push(data);
        var twoReq = true;
        while (twoReq) {
            try {
                twoReq = false;
                if (!socketEnded) {
                    var httpReq = processRequest.processData(buffer.join(""), socket);
                    if (httpReq.finish == true) {
                        var httpResponse = new ServerResponse(httpReq);
                        httpResponse.assignSocket(socket);
                        self.emit('request', httpReq, httpResponse);
                        if (httpReq.closeConnection == true) {
                            socketEnded = true;
                        }
                        buffer = [];
                        if (httpReq.leftOvers.trim() !== "") {
                            buffer.push(httpReq.leftOvers);
                            twoReq = true;
                        }
                    }
                }
            } catch(e) {
                buffer = [];
                //console.error(e);
                handleFileSystem.handleErrorAndStatus(e, socket);
            }
        }
    }
}

