var _ = require('underscore');
var promise = require('node-promise');

function RestfulController(req, res) {
    this.req = req;
    this.res = res;
}

_.extend(RestfulController.prototype, {

    doGet: function(params){
        return promise.delay(1).then(function(){
            return {id:'GET:' + params.id};
        });
    },

    doPost: function(params){
        console.log('####### post body');
        console.log(this.req.body);

        return promise.delay(1).then(function(){
            return {id:'POSTED'};
        });
    },

    doPut: function(params){
        console.log('####### put body');
        console.log(this.req.body);
        return promise.delay(1).then(function(){
            return {put: 'already put'};
        });
    },

    doDelete: function(params){
        console.log('####### delete body');
        console.log(this.req.body);
        return promise.delay(1).then(function(){
            return {delete: 'success'};
        });
    }
});


exports.RestfulController = RestfulController;