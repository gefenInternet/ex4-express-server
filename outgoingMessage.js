/**
 * Created by Nir on 1/5/14.
 */
var timers = require('timers');
var util = require('util');
var CRLF = "\r\n";

var connectionExpression = /Connection/i;
var transferEncodingExpression = /Transfer-Encoding/i;
var closeExpression = /close/i;
var contentLengthExpression = /Content-Length/i;
var dateExpression = /Date/i;
var expectExpression = /Expect/i;

var defaultHeaders = {
    connection: true,
    'content-length': true,
    'transfer-encoding': true,
    date: true
};
var dateCache;
function utcDate() {
    if (!dateCache) {
        var d = new Date();
        dateCache = d.toUTCString();
        timers.enroll(utcDate, 1000 - d.getMilliseconds());
        timers._unrefActive(utcDate);
    }
    return dateCache;
}

function OutgoingMessage() {

    this.output = [];
    this.outputEncodings = [];
    this.outputCallbacks = [];
    this.body = null;
   // this.headers = {};

    this.writable = true;

    this._last = false;
    this.chunkedEncoding = false;
    this.shouldKeepAlive = true;
    this.useChunkedEncodingByDefault = true;
    this.sendDate = false;
    this._removedHeader = {};

    this._hasBody = true;
    this._trailer = '';

    this.finished = false;
    this._hangupClose = false;

    this.socket = null;
    this.connection = null;
}

exports.OutgoingMessage = OutgoingMessage;

OutgoingMessage.prototype._send = function(data, encoding, callback) {
    if (!this._headerSent) {
        if (typeof data === 'string' &&
            encoding !== 'hex' &&
            encoding !== 'base64') {
            data = this._header + data;
        } else {
            this.output.unshift(this._header);
            this.outputEncodings.unshift('binary');
            this.outputCallbacks.unshift(null);
        }
        this._headerSent = true;
    }
    return this._writeRaw(data, encoding, callback);
};

OutgoingMessage.prototype.getHeader = function(name) {
    if (arguments.length < 1) {
        throw new Error('`name` is required for getHeader().');
    }

    if (!this._headers) return;

    var key = name.toLowerCase();
    return this._headers[key];
};

OutgoingMessage.prototype._writeRaw = function(data, encoding, callback) {

    if (this.connection &&
        this.connection.writable &&
        !this.connection.destroyed) {
        while (this.output.length) {
            if (!this.connection.writable) {
                this._buffer(data, encoding, callback);
                return false;
            }
            var c = this.output.shift();
            var e = this.outputEncodings.shift();
            var cb = this.outputCallbacks.shift();
            this.connection.write(c, e, cb);
        }

        // Directly write to socket.
        this.connection.write(data, encoding, callback);
        if (this.req.closeConnection){
            this.connection.end();
        }
    } else if (this.connection && this.connection.destroyed) {
        return false;
    } else {
        // buffer, as long as we're not destroyed.
        this._buffer(data, encoding, callback);
        return false;
    }
};


OutgoingMessage.prototype._buffer = function(data, encoding, callback) {
    this.output.push(data);
    this.outputEncodings.push(encoding);
    this.outputCallbacks.push(callback);
    return false;
};


OutgoingMessage.prototype.write = function(chunk, encoding, callback) {
    if (!this._header) {
        this._implicitHeader();
    }

    if (!this._hasBody) {
        console.error('This type of response MUST NOT have a body. ' +
            'Ignoring write() calls.');
        return true;
    }

    if (chunk.length === 0) return true;

    var ret;
    ret = this._send(chunk, encoding, callback);
    return ret;
};


OutgoingMessage.prototype._storeHeader = function(firstLine, headers) {
    // in the case of response it is: 'HTTP/1.1 200 OK\r\n'
    var state = {
        sentConnectionHeader: false,
        sentContentLengthHeader: false,
        sentTransferEncodingHeader: false,
        sentDateHeader: false,
        sentExpect: false,
        messageHeader: firstLine
    };

    if (headers) {
        var keys = Object.keys(headers);
        var isArray = util.isArray(headers);
        var field, value;

        for (var i = 0, l = keys.length; i < l; i++) {
            var key = keys[i];
            if (isArray) {
                field = headers[key][0];
                value = headers[key][1];
            } else {
                field = key;
                value = headers[key];
            }

            if (util.isArray(value)) {
                for (var j = 0; j < value.length; j++) {
                    storeHeader(this, state, field, value[j]);
                }
            } else {
                storeHeader(this, state, field, value);
            }
        }
    }

    // Date header
    if (this.sendDate == true && state.sentDateHeader == false) {
        state.messageHeader += 'Date: ' + utcDate() + CRLF;
    }


    var statusCode = this.statusCode;

    // keep-alive logic
    if (this._removedHeader.connection) {
        this._last = true;
        this.shouldKeepAlive = false;
    } else if (state.sentConnectionHeader === false) {
        var shouldSendKeepAlive = this.shouldKeepAlive &&
            (state.sentContentLengthHeader);
        if (shouldSendKeepAlive) {
            state.messageHeader += 'Connection: keep-alive\r\n';
        } else {
            this._last = true;
            state.messageHeader += 'Connection: close\r\n';
        }
    }

    this._header = state.messageHeader + CRLF;
    this._headerSent = false;
};

function storeHeader(self, state, field, value) {
    // Protect against response splitting. The if statement is there to
    // minimize the performance impact in the common case.
    if (/[\r\n]/.test(value))
        value = value.replace(/[\r\n]+[ \t]*/g, '');

    state.messageHeader += field + ': ' + value + CRLF;

    if (connectionExpression.test(field)) {
        state.sentConnectionHeader = true;
        if (closeExpression.test(value)) {
            self._last = true;
        } else {
            self.shouldKeepAlive = true;
        }

    } else if (transferEncodingExpression.test(field)) {
        state.sentTransferEncodingHeader = true;
        if (chunkExpression.test(value)) self.chunkedEncoding = true;

    } else if (contentLengthExpression.test(field)) {
        state.sentContentLengthHeader = true;
    } else if (dateExpression.test(field)) {
        state.sentDateHeader = true;
    } else if (expectExpression.test(field)) {
        state.sentExpect = true;
    }
}


OutgoingMessage.prototype.setHeader = function(name, value) {
    if (arguments.length < 2) {
        throw new Error('`name` and `value` are required for setHeader().');
    }

    if (this._header) {
        throw new Error('Can\'t set headers after they are sent.');
    }

    var key = name.toLowerCase();
    this._headers = this._headers || {};
    this._headerNames = this._headerNames || {};
    this._headers[key] = value;
    this._headerNames[key] = name;

    if (defaultHeaders[key]) {
        this._removedHeader[key] = false;
    }
};

OutgoingMessage.prototype.end = function(data, encoding, callback) {

    if (this.finished) {
        return false;
    }

    if (!this._header) {
        this._implicitHeader();
    }

    if (data && !this._hasBody) {
        console.error('This type of response MUST NOT have a body. ' +
            'Ignoring data passed to end().');
        data = null;
    }

    if (this.connection && data)
   //     this.connection.cork();

    var ret;
    if (data) {
        // Normal body write.
        ret = this.write(data, encoding);
    }

    if (this.connection && data)
  //      this.connection.uncork();

    this.finished = true;
    return ret;
};

OutgoingMessage.prototype._renderHeaders = function() {
    if (this._header) {
        throw new Error('Can\'t render headers after they are sent to the client.');
    }

    if (!this._headers) return {};

    var headers = {};
    var keys = Object.keys(this._headers);
    for (var i = 0, l = keys.length; i < l; i++) {
        var key = keys[i];
        headers[this._headerNames[key]] = this._headers[key];
    }
    return headers;
};