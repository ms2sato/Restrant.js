var _ = require('underscore'),
    promise = require('node-promise'),
    en = require('../model/entry'),
    mm = require('../../../mongoose_module'),
    rst = require('../../../index'),
    util = require('util');

function MongooseController(req, res) {
    rst.BasicController.call(this, req, res);
}

util.inherits(MongooseController, rst.BasicController);

_.extend(MongooseController.prototype, {

    /**
     * Mongoose Entity(required)
     * @returns {*}
     */
    getEntityType: function () {
        return en.EntryEntity;
    },

    /**
     * get Entity's id label(optional)
     * @returns {string}
     */
    getIdLabel: function () {
        return '_id';
    },

    /**
     * Arrange attributes on post(optional)
     * @param attr
     */
    arrangePostAttr: function(attr){
         return attr;
    },

    /**
     * Arrange attributes on put(optional)
     * @param attr
     */
    arrangePutAttr: function(attr){
        attr.updatedAt = new Date();
        return attr;
    }

});

// mixin method of mongoose module
mm.MongooseModule.mixinTo(MongooseController);

exports.MongooseController = MongooseController;