var promise = require('node-promise');


function SnakeCaseController(){

}

SnakeCaseController.prototype.test = function(){
    return promise.delay(1).then(function(){
        return {'result':'OK'};
    });
}

exports.SnakeCaseController = SnakeCaseController;
