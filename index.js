var _ = require('underscore');

function debugLog(text) {
//    console.log(text);
}

function debugDir(obj) {
//    console.dir(obj);
}


var Router = function () {
    this.router = [];
}

Router.prefixOfValue = ':';
Router.separatorOfType = ':';


function normalizeParts(parts) {
    if (_.last(parts) == '') {
        parts.pop();
    }
    return parts;
}


Router.PathParser = function (template, options) {
    if (template === undefined || template === null) {
        throw new Error('template is not found');
    }

    options = options || {

    };

    this.template = template;
    this.tparts = normalizeParts(template.split('/'));
    this.placeholders = options.placeholders || {};
    this.options = options;


    debugLog(this.tparts);
    debugLog(this.options);

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


    parse: function (path) {

        var atQue = path.indexOf('?');
        if (atQue != -1) {
            path = path.substr(0, atQue);
        }
        var pparts = normalizeParts(path.split('/'));
        debugLog('###');
        debugDir(pparts);
        debugDir(this.tparts);

        if (this.tparts.length != pparts.length) return false;

        debugLog(pparts);
        for (var i = 0; i < this.tparts.length; ++i) {

            var tpart = this.tparts[i];
            var ppart = pparts[i];

            if (tpart == ppart) {
                continue;
            } else if (tpart.charAt(0) == Router.prefixOfValue) {
                //placeholder
                var tFullName = tpart.substr(1);
                var paramValue = ppart;

                if (ppart.length == 0) return false;

                var ret = applyPlaceholder2Type(tFullName, paramValue);
                if (!ret) return false;

                this.placeholders[ret.name] = ret.value;
                continue;
            }

            return false;
        }

        debugLog('match: path ' + path + '; tparts' + this.tparts);

        return true;
    }

};

function applyPlaceholder2Type(tFullName, paramValue) {

    if (tFullName.indexOf(Router.separatorOfType) == -1) {
        debugLog('#### has not type: tFullName ' + tFullName + '; paramValue ' + paramValue);
        return {
            name: tFullName,
            value: paramValue
        };
    } else {
        debugLog('#### has type');

        var nameWithType = tFullName.split(Router.separatorOfType);
        debugDir(nameWithType);


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

        return {
            name: name,
            value: value
        };
    }

}


Router.ParamParser = function (template, options) {

    if (template === undefined || template === null) {
        throw new Error('template is not found');
    }

    var opt = {
        placeholders: {}
    };

    options = _.extend(opt, options);

    this.template = template;
    this.tparts = template.split('&');
    this.placeholders = options.placeholders;

};

Router.ParamParser.prototype = {

    parse: function (params) {

        debugDir(this.tparts);
        debugDir(params);

        for (var i = 0; i < this.tparts.length; ++i) {

            var tpart = this.tparts[i];
//            debugDir(tpart);

            var item = tpart.split('=');
            var tkey = item[0];
            var tvalue = item[1];


            debugDir(item);
            var paramValue = params[tkey];
            debugDir(paramValue);


            if (!paramValue) return false;

            if (tvalue.charAt(0) == Router.prefixOfValue) {
                var name;
                var value;

                // plaeholder
                var tFullName = tvalue.substr(1);
                var ret = applyPlaceholder2Type(tFullName, paramValue);
                if (!ret) return false;

                this.placeholders[ret.name] = ret.value;

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
    //debugDir(options);
    this.router = router;
    this.options = options;
}

Router.BasicHandler.prototype = {

    findProcess: function (req, res) {
        var self = this;

        //debugDir(this.options);

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

var httpMethods = {'get': true, 'post': true, 'head': true, 'put': true, 'option': true};

Router.PathHandler.prototype = {

    findProcess: function (req, res) {

        var self = this;
        var path = this.path;
        var options = this.options;

        var match;
        var placeholders = {};

        var requestedMethod = req.method ? req.method.toLowerCase() : 'get';
        if (options.method) {

            var wating = options.method.toLowerCase();
            if (wating != 'all') {
                if (wating != requestedMethod) return false;
            }
        }

        //with params
//        if (path.indexOf('?') == -1) {
//            debugDir('pathAndQuery without params');
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
                } else {
                    var pathAndQuery = path.split('?');
                    debugDir('pathAndQuery');
                    debugDir(pathAndQuery);

                    path = pathAndQuery[0];
                    query = pathAndQuery[1];
                }


                var pathParser = new Router.PathParser(path, {
                    placeholders: placeholders
                });
                if (!pathParser.parse(req.url)) return false;

                if (query) {
                    var paramParser = new Router.ParamParser(query, {
                        placeholders: placeholders
                    });

                    if (requestedMethod == 'post' || requestedMethod == 'put') {
                        if (!paramParser.parse(req.body)) return false;
                    } else {
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
    push: function (options) {
        this.router.push(new Router.BasicHandler(this, options));
        return this;
    },

    fullpath: function (url, process, options) {
        var self = this;
        options = options || {};

        return this.push({
            condition: function (req, res) {
                if (options.host) {
                    if (options.host != req.host) return false;
                }
                var fullurl = self.getFullUrl(req, res);
                return fullurl == url;
            },

            process: function (req, res) {
                return process.call(self, req, res);
            }
        });
    },

    path: function (path, process, options) {
        var self = this;

        if (!path) {
            throw new Error('path == null');
        }

        return this.router.push(new Router.PathHandler(this, path, process, options));
    },

    on: function (options, handler) {
        var self = this;

        if (!options.path) {
            throw new Error('path == null');
        }

        return this.router.push(new Router.PathHandler(this, options.path, handler, options));
    },


    //private
    find: function (req, res) {

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
    getFullUrl: function (req, res) {
        var schema = 'http';// TODO: 後で調べる
        var fullurl = schema + '://' + req.headers.host + req.url;

//        debugLog(fullurl);
//        debugLog(req.method);

        return fullurl;
    },

    execute: function (req, res) {

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
    onNotFound: function (req, res, fullurl) {
        //TODO: 404する
        debugLog('not found:' + fullurl);
        res.send('404 not found', 404);
    }

};


function ClassCodeGenerator() {
}

_.extend(ClassCodeGenerator.prototype, {

    createHeader: function(namespace){
        namespace = namespace || 'RESTRANT';

        var c = '(function(global){\n';
        c += 'var exports = global.' + namespace + ' = {};\n';
        c += 'exports._request = function(params){\n';
        c += '\treturn $.ajax(params);\n'
        c += '};\n\n';
        return c;
    },

    createFooter: function(){
        var c = '})(this);';
        return c;
    },


    getClassName: function (metadata) {
        return CamelSnakeConvertor.toCamel(metadata.controller) + 'Controller';
    },

    createClass: function (metadata) {

        var controllerName = this.getClassName(metadata);
        var c = 'exports.' + controllerName + ' = function(){}\n';
        c += 'exports.' + controllerName + '.prototype._request = function(params){\n';
        c += '\treturn exports._request(params);\n'
        c += '};\n\n';

        return c;
    },

    createFunction: function (metadata) {
        var actionName = metadata.action;
        var path = metadata.path;
        var controllerName = this.getClassName(metadata);

        var quesIndex = path.indexOf('?');
        if (quesIndex != -1) {
            path = path.substr(0, quesIndex);

//            var paramsStr = path.substr(quesIndex + 1);
//            var paramStrs = paramsStr.split('&');
        }

        path = path.replace(/:([a-zA-Z0-9]+)/, '" + params.$1 + "');

        var method = metadata.method;

        var c = 'exports.' + controllerName + '.prototype.' + actionName + ' =  function(params){\n';
        c += '\treturn this._request({\n';
        c += '\t\turl:"' + path + '"\n';
        c += '\t\t,data: params\n'

        if (method) {
            c += '\t\t,type: "' + method + '"\n'
        }

        c += '\t});\n';
        c += '};\n';

        return c;
    }
});


function ClientSourceCodeGenerator(metadatas) {
    this.metadatas = metadatas || [];
}

_.extend(ClientSourceCodeGenerator.prototype, {

    push: function(metadata){
        this.metadatas.push(metadata);
    },

    getCode: function(namespace){
        var ccg = new ClassCodeGenerator();

        var classmetas = _.groupBy(this.metadatas, function(metadata){
            return metadata.controller;
        });


        var content = ccg.createHeader(namespace);

        _.each(classmetas, function (metadatas) {

            content += ccg.createClass(_.first(metadatas));
            _.each(metadatas, function(metadata){
                content += ccg.createFunction(metadata);
            });

        });

        content += ccg.createFooter();
        return content;
    }
});


var CamelSnakeConvertor = function () {
}

_.extend(CamelSnakeConvertor, {

    toCamel: function (targetStr) {
        targetStr = targetStr.substr(0, 1).toUpperCase() + targetStr.substr(1);

        return targetStr.replace(/_([a-z])/, function (all, g1) {
            return g1.toUpperCase().substr(1);
        });
    },

    toSnake: function (targetStr) {
        var convertedStr = targetStr
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .replace(/([a-z])([A-Z])/g, '$1_$2');
        return convertedStr.toLowerCase();
    }

});

var ControllerFactory = function () {
    this.controllers = {};
}

_.extend(ControllerFactory.prototype, {

    push: function (key, Controller) {
//        console.dir(Controller);

        if (_.isFunction(key)) {
            Controller = key;

            var typeName = Controller.name;
            if (!typeName) throw new Error('Undefined Controller.name. for Constructor with name, like "function TypeName() {}" is standard.');
            key = CamelSnakeConvertor.toSnake(typeName.replace(/Controller$/, ''));
        }

//        console.log('key: ' + key);
//        console.log('Controller: ' + Controller);

        if (!key) {
            throw new Error('Unexpected key: ' + key);
        }
        this.controllers[key] = Controller;
    },

    get: function (key, req, res) {
//        console.log(key);

        if (!key) {
            throw new Error('key is undefined: ' + key);
        }

        var Controller = this.controllers[key];
        if (!Controller) throw new Error('Controller not found:' + key);
        return new Controller(req, res);
    }

});

var Restrant = function (router, controllerFactory) {
    this.router = router || new Router();
    this.controllerFactory = controllerFactory || new ControllerFactory();


    this.prefix = Router.prefixOfValue;
    this.controllerLabel = 'controller';
    this.actionLabel = 'action';

    this.metadatas = [];
}

_.extend(Restrant.prototype, {

    publishController: function () {
        this.controllerFactory.push.apply(this.controllerFactory, arguments);
    },

    on: function (options) {

        this.metadatas.push(options);


        var action = options.action;
        var cname = options.controller;
        if (options.path.indexOf(this._getContollerNameOfPath()) == -1 && !cname) {
            throw new Error('Controller name not specified. set "' + this._getContollerNameOfPath() + '" in path or options.controller');
        }

        var self = this;
        this.router.on(options, function (req, res) {

            cname = cname || self._getControllerNameOfParams(this.params); //specified cname is important for security
            var controller = self.controllerFactory.get(cname, req, res);
            if (!controller) {
                throw new Error(cname + ' controller is not publish');
            }

            var method = action || self._getActionNameOfParams(this.params); //specified action is important for security
            var func = controller[method];
            if (!func) {
                throw new Error(cname + '.' + method + ' not found');
            }

            if (!_.isFunction(func)) {
                throw new Error(cname + '.' + method + ' is not a function');
            }

            self._returnResult(func.call(controller, this.params), req, res);

        });
    },

    execute: function () {
        this.router.execute.apply(this.router, arguments);
    },


    stub: function(options){

        var path = options.path || 'stub.js';
        var namespace = options.namespace || 'RESTRANT';

        var cscg = new ClientSourceCodeGenerator(_.filter(this.metadatas, function(metadata){
            return metadata.controller;
        }));

        var code = cscg.getCode(namespace);

        this.router.on({
            path: path
        }, function(req, res){
            res.writeHead(200, {'Content-Type': 'application/javascript'});
            res.end(code);
        });
    },

    _returnResult: function (promise, req, res) {

        return promise.then(function (data) {
            res.json(data);
        });
    },

    _getContollerNameOfPath: function () {
        return this.prefix + this.controllerLabel;
    },

    _getActionNameOfPath: function () {
        return this.prefix + this.actionLabel;
    },

    _getControllerNameOfParams: function (params) {
        return params[this.controllerLabel];
    },

    _getActionNameOfParams: function (params) {
        return params[this.actionLabel];
    }

});


exports.Router = Router;
exports.Restrant = Restrant;
exports.ClientSourceCodeGenerator = ClientSourceCodeGenerator;
exports.ClassCodeGenerator = ClassCodeGenerator;