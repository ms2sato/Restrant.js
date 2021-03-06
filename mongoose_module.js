var rst = require('./index'),
    _ = require('underscore'),
    u = require('util'),
    promise = require('node-promise'),
    convertNodeAsyncFunction = promise.convertNodeAsyncFunction;

////////////////////////////////////////////////////
/**
 * mix-in Module for Mongoose RestfulController
 */
var MongooseModule = {
};

/**
 * required method list
 * @type {Array}
 */
MongooseModule.requires = [
    'getEntityType'
];

/**
 * optional method list
 * @type {{getIdLabel: Function, arrangePostAttr: Function, arrangePutAttr: Function}}
 */
MongooseModule.optionals = {

    getIdLabel: function () {
        return '_id';
    },

    arrangePostAttr: function (attr) {
        return this.populateOnRequest(attr);
    },

    arrangePutAttr: function (attr) {
        return this.populateOnRequest(attr);
    },

    populateOnRequest: function (attr) {
        return attr;
    },

    populateOnResponse: function (attr) {
        return attr;
    }

};

_.extend(MongooseModule, {

    doGet: function (params) {
        var self = this;
        var idlabel = this.getIdLabel();
        var opt = {};
        opt[idlabel] = params.id;

        return this.selectOneWithPopulate(opt);
    },

    doPost: function (params) {

        var values = params;
        console.dir(values);
        values = this.arrangePostAttr(values, params);
        if (!values) {
            throw new Error('Illegal return value on arrangePostAttr:' + values);
        }

        return this.insert(values).then(function (val) {
            return val[0];
        });
    },

    doPut: function (params) {

        var idlabel = this.getIdLabel();
        var values = _.clone(params);

        var self = this;
        var _id = params.id;
        var opt = {};
        opt[idlabel] = _id;

        console.dir(values);
        delete values[idlabel];

        values = this.arrangePutAttr(values, params);
        if (!values) {
            throw new Error('Illegal return value on arrangePutAttr:' + values);
        }

        return this.update(opt, values, {upsert: true}).then(function () {
            return self.selectOneWithPopulate(opt);
        });
    },

    doDelete: function (params) {
        var idlabel = this.getIdLabel();
        var opt = {};
        opt[idlabel] = params.id;
        return this.remove(opt).then(function () {
            return opt;
        });
    },

    select: function () {
        var Entity = this.getEntityType();
        return convertNodeAsyncFunction(Entity.find).apply(Entity, arguments);
    },

    selectWithPopulate: function () {
        var self = this;
        return this.select.apply(this, arguments).then(function (vals) {
            _.map(vals, function (val) {
                return self.populateOnResponse(val);
            });
        });
    },

    selectOne: function () {
        var Entity = this.getEntityType();
        return convertNodeAsyncFunction(Entity.findOne).apply(Entity, arguments);
    },

    selectOneWithPopulate: function () {
        var self = this;
        return this.selectOne.apply(this, arguments).then(function (val) {
            if (!val) {
                return val;
            } else {
                return self.populateOnResponse(val);
            }
        });
    },

    update: function () {
//        console.log('###')
//        console.dir(arguments);
        var Entity = this.getEntityType();
        return convertNodeAsyncFunction(Entity.update).apply(Entity, arguments);
    },

    insert: function (options) {
//        console.log("############ insert");
//        console.dir(options);

        var opt = _.defaults(options || {}, {});
        var Entity = this.getEntityType();
        var e = new Entity();
//        console.dir(e);
        _.extend(e, opt);

        function saveEntity(callback) {
            e.save(callback);
        }

        return convertNodeAsyncFunction(saveEntity)();
    },

    removeAll: function (options) {
        var opt = _.defaults(options || {}, {});
        return convertNodeAsyncFunction(this.getEntityType().remove)(opt);
    },

    remove: function (options) {
        if (!options) {
            throw new Error('options = null');
        }

        var opt = _.defaults(options || {}, {});
        var Entity = this.getEntityType();
        return convertNodeAsyncFunction(Entity.remove).call(Entity, opt);
    }


});

rst.mixable(MongooseModule);


function createMongooseControllerType(params) {

    params = _.defaults(params, {
        superType: rst.BasicController,
        interceptor: {}
    });

    if (!params.name) {
        throw new Error('params.name required');
    }

    if (!params.interceptor.getEntityType) {
        throw new Error('params.interceptor.getEntityType required');
    }

    var Controller = rst.extend(params.superType, params.interceptor, params);

    // mixin MongooseModule
    var MM = MongooseModule;
    return MM.mixinTo(Controller);
}

/**
 * Create Controller for Restrant with Mongoose restful methods.
 * @type {Function}
 */
MongooseModule.createMixedController = createMongooseControllerType;

exports.MongooseModule = MongooseModule;