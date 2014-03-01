var request = require('./request');
var miniHttp = require('./miniHttp');
var response = require('./response');
var path = require('path');
var RequestRoute = require('./RequestRoute');
var querystring = require('./querystring');

var miniExpress = function () {

    var handlers = [];
    var app = function (req, res, currIndex) {
        try {
            req.__proto__ = request;
            res.__proto__ = response; // TODO change to util inherit
            var finishedHandling = true;
            if (req.url === '/favicon.ico') {
                res.writeHead(200, {'Content-Type': 'image/x-icon'});
                res.end(/* icon content here */);
                return;
            }
            if (currIndex === undefined) {
                currIndex = 0;
            }

            if (currIndex >= handlers.length) {
                res.send(404, 'request index is larger than handlers array');
                return;
            }

            for (; currIndex < handlers.length; currIndex++) {
                if (handlers[currIndex].method.toLowerCase() === req.method.toLowerCase() || handlers[currIndex].method === '') {
                    if (handlers[currIndex].match(req.path)) { //the path matches the resource
                        var next = function () {
                            app(req, res, currIndex + 1);
                        };
                        req.params = handlers[currIndex].params;
                        req.currPath = handlers[currIndex].path;
                        handlers[currIndex].callbacks(req, res, next);
                        finishedHandling = false;
                        break;
                    }
                }
            }

            if (finishedHandling && currIndex >= handlers.length) {
                res.send(404, 'request index is larger than handlers array');
            }
        }
        catch (e) {
            console.log('error in app handling function ' + e.toString());
            if (req.socket !== undefined) {
                res.send(500, 'error in app function');
            }
        }
    };


    app.use = function (resource, func) {
        try {
            if (func === undefined) {
                func = resource;
                resource = '/';
            }
            routeRequest(resource, func, '');
        }
        catch (e) {
            console.log('error in use function :' + e.toString());
        }

    };
    app.listen = function (port) {
        var server = miniHttp.createServer(app);
        return server.listen(port);
    };

    app.get = function (resource, func) {
        try {
            if (func === undefined) {
                func = resource;
                resource = '/';
            }
            routeRequest(resource, func, 'get');
        }
        catch (e) {
            console.log('error in get function :' + e.toString());
        }
    };

    app.post = function (resource, func) {
        try {
            if (func === undefined) {
                func = resource;
                resource = '/';
            }
            routeRequest(resource, func, 'post');
        }
        catch (e) {
            console.log('error in post function :' + e.toString());
        }
    };

    app.delete = function (resource, func) {
        try {
            if (func === undefined) {
                func = resource;
                resource = '/';
            }
            routeRequest(resource, func, 'delete');
        }
        catch (e) {
            console.log('error in delete function :' + e.toString());
        }
    };

    app.route = function () {
        try {
            return this.routes;
        }
        catch (e) {
            console.log('error in route' + e.toString());
        }
    };

    app.put = function (resource, func) {
        try {
            if (func === undefined) {
                func = resource;
                resource = '/';
            }
            routeRequest(resource, func, 'put');
        }
        catch (e) {
            console.log('error in put function :' + e.toString());
        }
    };

    var routeRequest = function (resource, func, requestType) {
        try {
            var routes;
            if (requestType !== '') {
                routes = new RequestRoute(requestType.toLowerCase(), resource, func);
                if (app.route === undefined) {
                    app.route = {};
                }
                if (app.route[requestType] === undefined) {
                    app.route[requestType] = [];
                }
                app.route[requestType][app.route[requestType].length] = {path: routes.path, method: requestType, callbacks: func,
                    keys: routes.keys, regexp: routes.regexp};
                handlers[handlers.length] = routes;
            }
            else {
                routes = new RequestRoute('', resource, func);
                handlers[handlers.length] = routes;
            }
        }
        catch (e) {
            console.log('error in entering function route in use' + e.toString());
        }
    };
    return app;
};

module.exports = miniExpress;


miniExpress.bodyParser = function () {
    var self = this;
    return function (httpRequest, httpResponse, next) {
        try {
            self.urlencoded()(httpRequest, httpResponse, function () {
            })
            self.json()(httpRequest, httpResponse, function () {
            });
            next();
        }
        catch (e) {
            console.log('error in body parser' + e.toString());
        }
    }
};

var handleFileSystem = require("./handleFileSystem");
miniExpress.static = function (rootFolder) {

    return function (httpRequest, httpResponse, next) {
        try {
            if (httpRequest.method.toLowerCase() === 'get') {
                var reqPath = httpRequest.currPath;
                for (var key in httpRequest.params) {
                    if (key !== undefined) {
                        if (httpRequest.params.hasOwnProperty(key)) {
                            reqPath = reqPath.replace(new RegExp(':' + key, 'g'), httpRequest.params[key]);
                        }
                    }
                }
                var fullPath = path.join(rootFolder, httpRequest.path.substring(reqPath.length));
                handleFileSystem.getFile(fullPath, rootFolder, httpResponse, httpRequest.closeConnection);
            }
            else {
                next();
            }
        }

        catch (e) {
            console.log('error in static function' + e.toString());
        }
    };
}

miniExpress.json = function () {
    return function (httpRequest, httpResponse, next) {
        try {
            if (httpRequest.body !== undefined) {
                httpRequest.body = JSON.parse(httpRequest.body);
            }
        }
        catch (e) {

        }
        next();
    }
};

miniExpress.cookieParser = function () {
    return function (httpRequest, httpResponse, next) {
        try {
            var cookiePairs = httpRequest.get('cookie');
            if (cookiePairs != undefined) {
                cookiePairs = cookiePairs.split(';');
                cookiePairs.forEach(function (entry) {
                    var cookiePair = entry.split('=');
                    httpRequest.cookies[cookiePair[0].trim()] = cookiePair[1].trim();
                });
            }
            else {
                httpRequest.cookies = {};
            }
        }
        catch
            (e) {
            console.log('error in cookie parser ' + e.toString());
        }
        next();
    }
};

miniExpress.urlencoded = function () {
    return function (httpRequest, httpResponse, next) {
        var contentType = httpRequest.get('Content-Type');
        if (contentType !== undefined && contentType.indexOf('application/x-www-form-urlencoded') !== -1) {
            try {
                httpRequest.body = querystring.parse(httpRequest.body);
            }
            catch (e) {
                console.log('error in urlencoded' + e.toString());
            }
        }
        next();
    }
};