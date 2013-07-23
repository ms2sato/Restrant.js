var _ = require('underscore');
var promise = require('node-promise');

function SampleController(req, res) {
    this.req = req;
    this.res = res;
}

_.extend(SampleController.prototype, {

    selectById:function(params){
        console.log("selectById:");
        console.dir(params);
        return promise.delay(1).then(function(){
            return {id:params.id};
        });
    },

    get: function(){
        return promise.delay(1).then(function(){
            return {id:'GET'};
        });
    },

    post: function(params){
        console.log("post:", params);
        return promise.delay(1).then(function(){
            return {id:'POST'};
        });
    }

});


exports.SampleController = SampleController;