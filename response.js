var server =  require('./server');

var res = module.exports = {
    __proto__: server.ServerResponse.prototype
};


res.merge = function(a, b){
    if (a && b) {
        for (var key in b) {
            a[key] = b[key];
        }
    }
    return a;
};

res.status = function(code){
    this.statusCode = code;
    return this;
};

res.send = function(body){
    var req = this.req;
    var head = 'HEAD' == req.method;
    var len;

    // allow status / body
    if (2 == arguments.length) {
        // res.send(body, status) backwards compat
        if ('number' != typeof body && 'number' == typeof arguments[1]) {
            this.statusCode = arguments[1];
        } else {
            this.statusCode = body;
            body = arguments[1];
        }
    }

    switch (typeof body) {
        // response status
        case 'number':
            this.get('Content-Type') || this.type('text/plain');
            this.statusCode = body;
            body = server.STATUS_CODES[body];
            break;
        // string defaulting to html
        case 'string':
            if (!this.get('Content-Type')) {
                this.charset = this.charset || 'utf-8';
                this.type('text/html');
            }
            break;
        case 'boolean':
        case 'object':
            if (null == body) {
                body = '';
            } else if (Buffer.isBuffer(body)) {
                this.get('Content-Type') || this.type('application/octet-stream');
            } else {
                return this.json(body);
            }
            break;
    }

    // populate Content-Length
    if (undefined !== body && !this.get('Content-Length')) {
        var isBuffer = Buffer.isBuffer(body);
        if (isBuffer){
            len = Buffer.byteLength(String(body));
        }
        else{
            len = body.length;
        }
        this.set('Content-Length', len);
    }

    // respond
    this.end( head ? null : body ,'binary');
    return this;
};


res.json = function(obj){
    // allow status / body
    if (2 == arguments.length) {
        // res.json(body, status) backwards compat
        if ('number' == typeof arguments[1]) {
            this.statusCode = arguments[1];
        } else {
            this.statusCode = obj;
            obj = arguments[1];
        }
    }
    var body = JSON.stringify(obj);

    // content-type
    this.charset = this.charset || 'utf-8';
    this.get('Content-Type') || this.set('Content-Type', 'application/json');

    return this.send(body);
};

res.contentType =
    res.type = function(type){
        return this.set('Content-Type', type);
    };

res.set =
    res.header = function(field, val){
        if (2 == arguments.length) {
            if (Array.isArray(val)) val = val.map(String);
            else val = String(val);
            this.setHeader(field, val);
        } else {
            for (var key in field) {
                this.set(key, field[key]);
            }
        }
        return this;
    };

res.get = function(field){
    return this.getHeader(field);
};

res.clearCookie = function(name, options){
    var opts = { expires: new Date(1), path: '/' };
    return this.cookie(name, '',  options
        ? res.merge(opts, options)
        : opts);
};

res.serialize = function(name, val, opt){
    opt = opt || {};
 //   var enc = opt.encode || encode;
    var pairs = [name + '=' + val];

    if (opt.maxAge) pairs.push('Max-Age=' + opt.maxAge);
    if (opt.domain) pairs.push('Domain=' + opt.domain);
    if (opt.path) pairs.push('Path=' + opt.path);
    if (opt.expires) pairs.push('Expires=' + opt.expires.toUTCString());
    if (opt.httpOnly) pairs.push('HttpOnly');
    if (opt.secure) pairs.push('Secure');

    return pairs.join('; ');
};

res.cookie = function(name, val, options){
    options = res.merge({}, options);
    var secret = this.req.secret;
    var signed = options.signed;
    if (signed && !secret) throw new Error('connect.cookieParser("secret") required for signed cookies');
    if ('number' == typeof val) val = val.toString();
    if ('object' == typeof val) val = 'j:' + JSON.stringify(val);
    if (signed) val = 's:' + sign(val, secret);
    if ('maxAge' in options) {
        options.expires = new Date(Date.now() + options.maxAge);
        options.maxAge /= 1000;
    }
    if (null == options.path) options.path = '/';
    this.set('Set-Cookie', res.serialize(name, String(val), options));
    return this;
};
