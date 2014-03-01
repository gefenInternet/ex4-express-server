function IncomingMessage(socket) {
    this.socket = socket;
    this.connection = socket;

    this.httpVersion = null;
    this.complete = false;
    this.headers = {};
    // request (server) only
    this.url = '';
    this.method = null;

    // response (client) only
    this.statusCode = null;
    this.statusMessage = null;
}

IncomingMessage.prototype._addHeaderLine = function(field, value, dest) {
    field = field.toLowerCase();
    switch (field) {
        // Array headers:
        case 'set-cookie':
            if (!(dest[field] == undefined)) {
                dest[field].push(value);
            } else {
                dest[field] = [value];
            }
            break;

        // Comma separate. Maybe make these arrays?
        case 'accept':
        case 'accept-charset':
        case 'accept-encoding':
        case 'accept-language':
        case 'connection':
        case 'cookie':
        case 'pragma':
        case 'link':
        case 'www-authenticate':
        case 'proxy-authenticate':
        case 'sec-websocket-extensions':
        case 'sec-websocket-protocol':
            if (!(dest[field] == undefined)) {
                dest[field] += ', ' + value;
            } else {
                dest[field] = value;
            }
            break;


        default:
            if (field.slice(0, 2) == 'x-') {
                // except for x-
                if (!(dest[field] == undefined)) {
                    dest[field] += ', ' + value;
                } else {
                    dest[field] = value;
                }
            } else {
                // drop duplicates
                if ((dest[field] == undefined)) dest[field] = value;
            }
            break;
    }
};

exports.IncomingMessage = IncomingMessage;