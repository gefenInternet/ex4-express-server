var server = require('./server');


exports.createServer = function(requestListener) {
    return new server.Server(requestListener);
};



