var _ = require('underscore'),
    u = require('util'),
    fs = require('fs');

function debugLog(text) {
    //console.log(text);
}

function debugDir(obj) {
    //console.dir(obj);
}

var httpMethods = {'get': true, 'post': true, 'delete': true, 'head': true, 'put': true, 'option': true};


var Router = function () {
    this.router = [];
};

Router.prefixOfValue = ':';
Router.separatorOfType = ':';


function normalizeParts(parts) {
    if (_.last(parts) === '') {
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


    debugLog('### tparts');
    debugLog(this.tparts);
    debugLog('### options');
    debugLog(this.options);

};

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

        var i;
        var atQue = path.indexOf('?');
        if (atQue != -1) {
            path = path.substr(0, atQue);
        }
        var pparts = normalizeParts(path.split('/'));
        debugLog('###');
        debugDir(pparts);
        debugDir(this.tparts);

        if (this.tparts.length != pparts.length) {
            return false;
        }

        debugLog(pparts);
        for (i = 0; i < this.tparts.length; i += 1) {

            var tpart = this.tparts[i];
            var ppart = pparts[i];

            if (tpart == ppart) {
                continue;
            }

            if (tpart.charAt(0) == Router.prefixOfValue) {
                //placeholder
                var tFullName = tpart.substr(1);
                var paramValue = ppart;

                if (ppart.length === 0) {
                    return false;
                }

                var ret = applyPlaceholder2Type(tFullName, paramValue);
                if (!ret) {
                    return false;
                }

                this.placeholders[ret.name] = ret.value;
                continue;
            }

            return false;
        }

        debugLog('match: path ' + path + '; tparts' + this.tparts);

        return true;
    }

};


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

        var i;
        debugDir(this.tparts);
        debugDir(params);

        for (i = 0; i < this.tparts.length; ++i) {

            var tpart = this.tparts[i];
            debugDir(tpart);

            var item = tpart.split('=');
            var tkey = item[0];
            var tvalue = item[1];


            debugDir(item);
            var paramValue = params[tkey];
            debugDir(paramValue);


            if (!paramValue) {
                return false;
            }

            if (tvalue.charAt(0) == Router.prefixOfValue) {
                var name;
                var value;

                // plaeholder
                var tFullName = tvalue.substr(1);
                var ret = applyPlaceholder2Type(tFullName, paramValue);
                if (!ret) {
                    return false;
                }

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
};

Router.BasicHandler.prototype = {

    findProcess: function (req, res) {
        var self = this;

        //debugDir(this.options);

        if (this.options.condition(req, res)) {
            return function () {
                return self.options.process(req, res);
            };
        }
        return false;
    }
};

Router.PathHandler = function (router, path, process, options) {
    this.router = router;
    this.options = options || {};
    this.path = path;
    this.process = process;
};

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
                if (wating != requestedMethod) {
                    return false;
                }
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
                    if (!paramParser.parse(req.body)) {
                        return false;
                    }
                } else {
                    if (!paramParser.parse(req.query)) {
                        return false;
                    }
                }
            }

            return true;
        };

        if (options.host && options.host != req.host) {
            return false;
        }

        var process = this.process;
        var params = (_.isFunction(options.params)) ? options.params(req, res) : options.params;
        self.params = _.extend(placeholders, params);
        if (match(req, res)) {
            return function () {
                return process.call(self, req, res);
            };
        }

    }
};


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

    /**
     * @param options.method method 'get', 'post',...
     * @param handler
     * @returns {Number}
     */
    on: function (options, handler) {
        var self = this;

        if (!options.path) {
            throw new Error('path == null');
        }

        console.log(JSON.stringify(options));
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


function toUpperTopCharacer(targetStr) {
    return targetStr.substr(0, 1).toUpperCase() + targetStr.substr(1);
}

var CamelSnakeConvertor = function () {
};

_.extend(CamelSnakeConvertor, {

    toCamel: function (targetStr) {
        targetStr = toUpperTopCharacer(targetStr);
        var ret = targetStr.replace(/_([a-z])/g, function (all, g1) {
            return g1.toUpperCase();
        });
        return ret;
    },

    toSnake: function (targetStr) {
        var convertedStr = targetStr
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .replace(/([a-z])([A-Z])/g, '$1_$2');
        return convertedStr.toLowerCase();
    }

});


function ClassCodeGenerator() {
}

var placeholderRegex = /:([a-zA-Z0-9]+)/g;
_.extend(ClassCodeGenerator.prototype, {

    createHeader: function (namespace) {
        namespace = namespace || 'RESTRANT';

        var c = '(function(global){\n';
        c += 'var exports = global.' + namespace + ' = {};\n';
        c += 'exports._request = function(params){\n';
        c += '\treturn $.ajax(params);\n';
        c += '};\n\n';

        c += 'exports._copy = function(params){\n';
        c += '\treturn $.extend(true, {}, params);\n';
        c += '};\n\n';

        return c;
    },

    createFooter: function () {
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
        c += '\treturn exports._request(params);\n';
        c += '};\n\n';
        c += 'exports.' + controllerName + '.prototype._copy = function(params){\n';
        c += '\treturn exports._copy(params);\n';
        c += '};\n\n';

        return c;
    },

    _getPlaceholderKeys: function (text) {
        var placeholderMatch = text.match(placeholderRegex);
        return _.map(placeholderMatch || [], function (item) {
            return item.substr(1);
        });
    },

    createFunction: function (metadata) {
        var actionName = metadata.action;
        var path = metadata.path;
        var controllerName = this.getClassName(metadata);

        //console.log(path);
        var placeholderKeys = this._getPlaceholderKeys(path);
        var url = path;

        var method = metadata.method;
        var quesIndex = path.indexOf('?');
        var pathWithoutQuery;
        if (quesIndex != -1) {
            pathWithoutQuery = path.substr(0, quesIndex);

            if (method.toLowerCase() != 'get') {
                url = pathWithoutQuery;
            }

        } else {
            pathWithoutQuery = path;
        }


        var usedParams = [];
        url = url.replace(placeholderRegex, function(str, p1){
            usedParams.push(p1);
            return '" + params.' + p1 + ' + "';
        });

        var c = 'exports.' + controllerName + '.prototype.' + actionName + ' =  function(sparams){\n';

        c+= '\tvar params = this._copy(sparams);\n\n';

        _.each(placeholderKeys, function (key) {
            c += '\tif(params.' + key + ' === undefined) { throw new Error("' + key + ' is undefined "); }\n';
        });

        var urlStr = '"' + url + '"';
        urlStr = urlStr.replace(/ \+ \"\"$/, '');

        c += '\t// ' + path + '\n';
        c += '\tvar url = ' + urlStr + ';\n';

        _.each(usedParams, function (key) {
            c += '\tdelete params.' + key + ';\n';
        });


        c += '\treturn this._request({\n';
        c += '\t\turl: url\n';
        c += '\t\t,data: params\n';

        if (method) {
            c += '\t\t,type: "' + method + '"\n';
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

    push: function (metadata) {
        this.metadatas.push(metadata);
    },

    getCode: function (namespace) {
        var ccg = new ClassCodeGenerator();

        var classmetas = _.groupBy(this.metadatas, function (metadata) {
            return metadata.controller;
        });


        var content = ccg.createHeader(namespace);

        _.each(classmetas, function (metadatas) {

            content += ccg.createClass(_.first(metadatas));
            _.each(metadatas, function (metadata) {
                content += ccg.createFunction(metadata);
            });

        });

        content += ccg.createFooter();
        return content;
    }
});


var ControllerFactory = function () {
    this.controllers = {};
};

_.extend(ControllerFactory.prototype, {

    push: function (key, Controller) {
//        console.dir(Controller);

        if (!key) throw new Error('Undefined key');

        var typeName;

        if (_.isFunction(key)) {
            Controller = key;

            typeName = Controller.name;
            if (!typeName) throw new Error('Undefined Controller.name. for Constructor with name, like "function TypeName() {}" is standard.');
            key = CamelSnakeConvertor.toSnake(typeName.replace(/Controller$/, ''));
        } else {
            typeName = key;

            if (!Controller) {
                throw new Error('Controller not found : ' + key);
            }

            if (!_.isFunction(Controller)) {
                throw new Error('Controller is not constuctor');
            }
        }

        if (!typeName) throw new Error('Undefined Controller.name. for Constructor with name, like "function TypeName() {}" is standard.');

        if (!key) {
            throw new Error('Unexpected key: ' + key);
        }


        console.log('Published: key:' + key + '; controller:' + Controller.name);
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
};

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

            console.log(req.method + "\t" + req.path);
            //console.log('body: ', req.body, '; query: ', req.query);

            res.finished = false;
            function onFinish() {
                res.finished = true;
            }

            res.addListener('finish', onFinish);

            try {
                cname = cname || self._getControllerNameOfParams(this.params); //specified cname is important for security
                var controller = self.controllerFactory.get(cname, req, res);
                if (!controller) {
                    throw new Error(cname + ' controller is not published');
                }

                var method = action || self._getActionNameOfParams(this.params); //specified action is important for security
                var func = controller[method];
                if (!func) {
                    throw new Error(cname + '.' + method + ' not found');
                }

                if (!_.isFunction(func)) {
                    throw new Error(cname + '.' + method + ' is not a function');
                }

                try {
                    var retobj = func.call(controller, this.params);
                    if (retobj) {

                        if (retobj.then && _.isFunction(retobj.then)) {
                            // as returned promise
                            self._returnResult(retobj, req, res);
                            return;
                        } else {
                            // as returned object
                            res.json(retobj);
                        }

                        return;
                    }

                    // end called
                    if (res.finished) {
                        return;
                    }

                    // end not called
                    console.log('[WARN]' + cname + '.' + method + ' should return promise or should call req.end()');
                    res.end();

                } catch (ex) {
                    console.log(ex.stack);
                    if (controller.handleError(ex) === false) {
                        throw ex;
                    }
                }
            } catch (fatalerr) {
                self._handleError(fatalerr, req, res);
            }
            return true;

        });
    },

    execute: function () {
        this.router.execute.apply(this.router, arguments);
    },

    restful: function (options) {

        var self = this;
        var root = options.path;
        var controller = options.controller;
        var params = options.params;
        var prefix = options.prefix || 'do';
        var placeholder = options.placeholder || 'id';

        _.each(httpMethods, function (method, key) {

            var path = root;
            if (key !== 'post') {
                path = root + '/:' + placeholder;
            }

            var action = prefix + toUpperTopCharacer(key);

            var opt = {path: path, controller: controller, action: action, method: key};
            if (params) {
                opt.params = params;
            }
            //debugDir(opt);
            self.on(opt);
        });

    },

    stub: function (options) {

        console.log('# generate stub ...');
        var namespace = options.namespace || 'RESTRANT';

        var cscg = new ClientSourceCodeGenerator(_.filter(this.metadatas, function (metadata) {
            return metadata.controller;
        }));
        var code = cscg.getCode(namespace);
        debugLog(code);

        if (options.file) {

//            if (options.watch) {
//                console.log('# watch to ' + options.watch);
//                var wstat = fs.statSync(options.watch);
//                var sstat = fs.statSync(options.file);
//                if (wstat.mtime == sstat.mtime) {
//                    console.log('# file not touched');
//                }
//            }

            console.log('# outoput stub to ' + options.file);
            var write = fs.createWriteStream(options.file);
            write.end(code);
        } else {
            var path = options.path || '/stub.js';
            this.router.on({
                path: path
            }, function (req, res) {
                res.writeHead(200, {'Content-Type': 'application/javascript'});
                res.end(code);
            });
        }

    },

    _handleError: function (err, req, res) {
        console.log(err);
        console.log(err.stack);
        throw err;
    },

    _returnResult: function (promise, req, res) {
        var self = this;
        return promise.then(function (data) {

            if (!res.finished) {
                res.json(data);
            }

        }, function (err) {
            if (!err) {
                throw new Error('err is undefined');
            }
            self._handleError(err, req, res);
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

/**
 * object oriented extend
 * @param SuperType super type
 * @param methods methods object
 * @param params
 * @returns {Function} NewType
 */
function extend(SuperType, methods, params) {
    params = _.defaults(params, {
    });

    // if function, as constructor only.
    if (_.isFunction(methods)) {
        methods = {
            initialize: methods
        };
    }

    var Type = function (req, res) {
        SuperType.call(this, req, res);

        if (methods.initialize) {
            methods.initialize.call(this);
        }
    };

    u.inherits(Type, SuperType);

    _.extend(Type.prototype, methods);

    Type.extend = function (methods, params) {
        return extend(Type, methods, params);
    };

    return Type;
}


////////////////////////////////////////////////////
function BasicController(req, res) {
    if (!req) throw new Error('req is undefined');
    if (!res) throw new Error('res is undefined');
    this.req = req;
    this.res = res;
}

BasicController.extend = function (methods, params) {
    return extend(this, methods, params);
};

_.extend(BasicController.prototype, {

    responseJson: function (promise) {
        var self = this;
        return this.guard(promise).then(function (ret) {
            self.res.json(ret);
        });
    },

    guard: function (promise) {
        var self = this;
        return promise.then(function (ret) {
            return ret;
        }, function (err) {
            self.handleError.call(self, err);
        });
    },

    handleError: function (err) {
        console.log(err.message);
        console.log(err.stack);
    }

});

////////////////////////////////////////////////////
/**
 * do mix-in
 * @param Module A Class for mixin parent
 */
function mixin(target, Module) {
    if (!target) {
        throw new Error('target not found');
    }

    if (!Module) {
        throw new Error('Module not found');
    }

    var $module = Module;
    _.extend(target, $module);
    target.$module = function () {
        return $module;
    };

    return target;
}

/**
 * define mix-in type function
 * @param Module A Module for mixin parent
 */
function mixable(Module) {

    if (!Module) {
        throw new Error('Module not found');
    }

    if (_.isFunction(Module)) {
        throw new Error('Module should not be function');
    }


    if (_.isObject(Module)) {

        Module.mixinTo = function (target) {

            if (!target) {
                throw new Error('target not found');
            }

            if (!_.isFunction(target)) {
                throw new Error('target is not constructor');
            }

            if (Module.requires) {
                _.each(Module.requires, function (req) {
                    if (!target.prototype[req]) {
                        throw new Error('target.prototype.' + req + '() is required');
                    }
                });
            }

            if (Module.optionals) {
                _.each(Module.optionals, function (opt, key) {
                    if (!target.prototype[key]) {
                        target.prototype[key] = opt;
                    }
                });
            }

            if (Module.validateType) {
                var msg = Module.validateType(target);
                if (msg) {
                    throw new Error(msg);
                }
            }

            mixin(target.prototype, Module);
            return target;
        };

    } else {
        throw new Error('Unimplemeted for this type');
    }
}

////////////////////////////////////////////////////
exports.Router = Router;
exports.Restrant = Restrant;
exports.ClientSourceCodeGenerator = ClientSourceCodeGenerator;
exports.ClassCodeGenerator = ClassCodeGenerator;
exports.BasicController = BasicController;
exports.extend = extend;
exports.mixin = mixin;
exports.mixable = mixable;
