module.exports = RequestRoute;

function RequestRoute(method, path, callbacks) {
    this.path = path;
    this.method = method;
    this.callbacks = callbacks;
    this.regexp = this.pathRegexp(path
        , this.keys = []
        , false
        , false);
}


RequestRoute.prototype.pathRegexp = function(path, keys, sensitive, strict) {
    if (toString.call(path) == '[object RegExp]') return path;
    if (Array.isArray(path)) path = '(' + path.join('|') + ')';
    path = path
        .concat(strict ? '' : '/?')
        .replace(/\/\(/g, '(?:/')
        .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?(\*)?/g, function(_, slash, format, key, capture, optional, star){
            keys.push({ name: key, optional: !! optional });
            slash = slash || '';
            return ''
                + (optional ? '' : slash)
                + '(?:'
                + (optional ? slash : '')
                + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
                + (optional || '')
                + (star ? '(/*)?' : '');
        })
        .replace(/([\/.])/g, '\\$1')
        .replace(/\*/g, '(.*)');
    return new RegExp('^' + path + '$', sensitive ? '' : 'i');
   // return new RegExp('^' + path, sensitive ? '' : 'i');
};

RequestRoute.prototype.match = function(path){
    var keys = this.keys
        , params = this.params = {}
        , m = this.regexp.exec(path)
        , n = 0;

    if (!m){
        var first = false;
        while(path.lastIndexOf('/') !== -1){
            var lastSlash = path.lastIndexOf('/');
            if (lastSlash == 0 && !first){
                first = true;
                path = "/";
            }
            else{
                path = path.substring(0, lastSlash);
            }
            m = this.regexp.exec(path);
            if (m){
                break;
            }
        }
        if (!m){
            return false;
        }
    }

    for (var i = 1, len = m.length; i < len; ++i) {
        var key = keys[i - 1];

        try {
            var val = 'string' == typeof m[i]
                ? decodeURIComponent(m[i])
                : m[i];
        } catch(e) {
            var err = new Error("Failed to decode param '" + m[i] + "'");
            err.status = 400;
            throw err;
        }

        if (key) {
            params[key.name] = val;
        } else {
            params[n++] = val;
        }
    }

    return true;
};