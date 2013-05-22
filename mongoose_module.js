var rst = require('./index'),
    _ = require('underscore'),
    mongoose = require('mongoose'),
    promise = require('node-promise'),
    convertNodeAsyncFunction = promise.convertNodeAsyncFunction;

////////////////////////////////////////////////////
/**
 * mix-in Module for Mongoose RestfulController
 * @constructor
 */
function MongooseModule() {
}

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
        return attr;
    },

    arrangePutAttr: function (attr) {
        return attr;
    }

};

_.extend(MongooseModule.prototype, {

    doGet: function (params) {
        var idlabel = this.getIdLabel();
        var opt = {};
        opt[idlabel] = params.id;

        return this.select(opt).then(function (val) {
            return val[0];
        });
    },

    doPost: function (params) {

        var values = this.arrangePostAttr(this.req.body);
        if(!values){
            throw new Error('Illegal return value on arrangePostAttr:' + values);
        }

        return this.insert(values).then(function (val) {
            return val[0];
        });
    },

    doPut: function (params) {

        var idlabel = this.getIdLabel();
        var values = _.clone(this.req.body);
        delete values[idlabel];

        var self = this;
        var _id = params.id;
        var opt = {};
        opt[idlabel] = _id;

        var values = this.arrangePutAttr(values);
        if(!values){
            throw new Error('Illegal return value on arrangePutAttr:' + values);
        }

        return this.update(opt, values).then(function () {
            return self.select(opt);
        }).then(function (val) {
                return val[0];
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

exports.MongooseModule = MongooseModule;