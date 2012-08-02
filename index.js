var _ = require('underscore');

var Router = function () {
    this.router = [];
}


Router.PathParser = function (template, options) {
    if (template === undefined || template === null) {
        throw new Error('template is not found');
    }

    options = options || {

    };

    this.template = template;
    this.tparts = template.split('/');
    this.placeholders = options.placeholders || {};
    this.options = options;


    console.log(this.tparts);
    console.log(this.options);

}

Router.PathParser.prototype = {

//    parse:function (req, res) {
//
//        if (this.options.host) {
//            if (this.options.host != req.host) return false;
//        }
//
//        var path = req.url;
//        return this.doParse(path);
//    },


    parse:function (path) {
        var pparts = path.split('/');
        if (this.tparts.length != pparts.length) return false;

       console.log(pparts);
        for (var i = 0; i < this.tparts.length; ++i) {

            var tpart = this.tparts[i];
            var ppart = pparts[i];

            if (tpart == ppart) {
                continue;
            } else if (tpart.charAt(0) == ':') {
                //placeholder
                this.placeholders[tpart.substr(1)] = ppart;
                continue;
            }

            return false;
        }

        return true;
    }

};

Router.ParamParser = function (template, options) {

    if (template === undefined || template === null) {
        throw new Error('template is not found');
    }

    var opt = {
        placeholders:{}
    };

    options = _.extend(opt, options);

    this.template = template;
    this.tparts = template.split('&');
    this.placeholders = options.placeholders;

};

Router.ParamParser.prototype = {

    parse:function (params) {

        console.dir(this.tparts);
        console.dir(params);

        for (var i = 0; i < this.tparts.length; ++i) {

            var tpart = this.tparts[i];
//            console.dir(tpart);

            var item = tpart.split('=');
            var tkey = item[0];
            var tvalue = item[1];


//            console.dir(item);
            var paramValue = params[tkey];
//            console.dir(paramValue);


            if (!paramValue) return false;

            if (tvalue.charAt(0) == ':') {
                var name;
                var value;

                // plaeholder
                var tFullName = tvalue.substr(1);

                if (tFullName.indexOf(':') == -1) {
                    name = tFullName;
                    value = paramValue;
                } else {
                    var nameWithType = tFullName.split(':');
//                    console.dir(nameWithType);


                    var name = nameWithType[0];
                    var type = nameWithType[1];
                    var value;

                    if (type == 'Integer') {
                        value = parseInt(paramValue);
                    } else if (type == 'Float') {
                        value = parseFloat(paramValue);
                    }

                    if (isNaN(value)) {
                        return false;
                    }

                }

                this.placeholders[name] = value;

            } else if (paramValue.toString() == tvalue) {
                continue;
            } else {
                return false;
            }
        }

        return true;
    }

};

Router.BasicHandler = function (router, options) {
    //console.dir(options);
    this.router = router;
    this.options = options;
}

Router.BasicHandler.prototype = {

    findProcess:function (req, res) {
        var self = this;

        //console.dir(this.options);

        if (this.options.condition(req, res)) {
            return function () {
                return self.options.process(req, res);
            }
        }
        return false;
    }
}

Router.PathHandler = function (router, path, process, options) {
    this.router = router;
    this.options = options || {};
    this.path = path;
    this.process = process;
}

var httpMethods = {'get' : true, 'post': true, 'head': true, 'put': true, 'option': true};

Router.PathHandler.prototype = {

    findProcess:function (req, res) {

        var self = this;
        var path = this.path;
        var options = this.options;

        var match;
        var placeholders = {};

        var requestedMethod = req.method? req.method.toLowerCase() : 'get';
        if (options.method) {

            var wating = options.method.toLowerCase();
            if (wating != 'all') {
                if(wating != requestedMethod) return false;
            }
        }

        //with params
//        if (path.indexOf('?') == -1) {
//            console.dir('pathAndQuery without params');
//
//            var pathParser = new Router.PathParser(path, {
//                placeholders:placeholders
//            });
//
//            match = function (req, res) {
//                return pathParser.parse(req.url);
//            };
//
//        } else

        {
            match = function (req, res) {

                var path = self.path;
                var query;
                if (path.indexOf('?') == -1) {
                     query = null;
                }else{
                    var pathAndQuery = path.split('?');
                    console.dir('pathAndQuery');
                    console.dir(pathAndQuery);

                    path = pathAndQuery[0];
                    query = pathAndQuery[1];
                }


                var pathParser = new Router.PathParser(path, {
                    placeholders:placeholders
                });
                if (!pathParser.parse(req.url)) return false;

                if(query){
                    var paramParser = new Router.ParamParser(query, {
                        placeholders:placeholders
                    });

                    if(requestedMethod == 'post' || requestedMethod == 'put'){
                        if (!paramParser.parse(req.body)) return false;
                    }else{
                        if (!paramParser.parse(req.query)) return false;
                    }
                }


                return true;
            }
        }
        ;

        if (options.host) {
            if (options.host != req.host) return false;
        }

        var process = this.process;
        var self = this;
        self.params = placeholders;
        if (match(req, res)) {
            return function () {
                return process.call(self, req, res);
            }
        }

    }
}


Router.prototype = {


    /**
     *
     * @param options{
     *     condition: function(req, res, fullurl){
     *
     *     },
     *     process: function(){
     *
     *     }
     * }
     */
    push:function (options) {
        this.router.push(new Router.BasicHandler(this, options));
        return this;
    },

    fullpath:function (url, process, options) {
        var self = this;
        options = options || {};

        return this.push({
            condition:function (req, res) {
                if (options.host) {
                    if (options.host != req.host) return false;
                }
                var fullurl = self.getFullUrl(req, res);
                return fullurl == url;
            },

            process:function (req, res) {
                return process.call(self, req, res);
            }
        });
    },

    path:function (path, process, options) {
        var self = this;

        if (!path) {
            throw new Error('path == null');
        }

        return this.router.push(new Router.PathHandler(this, path, process, options));
    },

    on:function (options, handler) {
        var self = this;

        if (!options.path) {
            throw new Error('path == null');
        }

        return this.router.push(new Router.PathHandler(this, options.path, handler, options));
    },


    //private
    find:function (req, res) {

        var self = this;
        for (var i = 0; i < this.router.length; ++i) {
            var m = this.router[i];
            var proc = m.findProcess(req, res);
            if (proc) {
                return proc;
            }
        }

        return false;
    },

    //private
    getFullUrl:function (req, res) {
        var schema = 'http';// TODO: 後で調べる
        var fullurl = schema + '://' + req.headers.host + req.url;

//        console.log(fullurl);
//        console.log(req.method);

        return fullurl;
    },

    execute:function (req, res) {

        var self = this;

        //var fullurl = this.getFullUrl(req, res);
        var handler = this.find(req, res);
        if (!handler) {
            // handler not found
            var fullurl = this.getFullUrl(req, res);
            this.onNotFound(req, res, fullurl);
            return;
        }

        handler(req, res);
    },

    //protected
    onNotFound:function (req, res, fullurl) {
        //TODO: 404する
        console.log('not found:' + fullurl);
        res.send('404 not found', 404);
    }

};

exports.Router = Router;