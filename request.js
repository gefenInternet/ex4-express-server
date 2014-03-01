var util = require('util');
var incomingMessage = require('./incomingMessage');

function Request(socket){
    incomingMessage.IncomingMessage.call(this,socket);
    var self = this;
    this.finish = false;
    this.body = undefined;
    this.leftOvers = "";
    this.connection = undefined;
    this.query = {};
    this.cookies = {};
    this.host = "";
    this.path = null; //what you want to get
    this.params = {}; //after ?
    this.protocol = null; //HTTP
    this.closeConnection = false;
    this.contentLength = null;
    this.cookieHeader = "";

    this.is = function(type){
        if (!("content-type" in self.headers)){
            return false;
        }
        var contentType = self.headers['content-type'];
        var pattern = new RegExp(type);
        return pattern.test(contentType);
    };

    this.get = function(field){
        return self.headers[field.toLowerCase()]; //TODO: check if this returns undefined when field doesn't exist
    };

    this.param = function(name){
        var params = this.params || {}; // TODO: fill this somehow
        var body = this.body || {}; //TODO: requires parsing body with json and url encode
        var query = this.query || {};
        if (null != params[name] && params.hasOwnProperty(name)) return params[name];
        if (null != body[name]) return body[name];
        if (null != query[name]) return query[name];
    };
}
util.inherits(Request, incomingMessage.IncomingMessage);
exports.Request = Request;

