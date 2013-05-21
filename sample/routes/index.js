/*
 * GET home page.
 */
var rst = require('../../index.js');
var Restrant = rst.Restrant;

var SampleController = require('../app/controller/sample_controller').SampleController;
var SnakeCaseController = require('../app/controller/snake_case_controller').SnakeCaseController;
var RestfulController = require('../app/controller/restful_controller').RestfulController;


// standard
var restrant = new Restrant();
restrant.publishController('sample', SampleController); //with keyname
restrant.publishController(SnakeCaseController); // keyname = snake_case
restrant.publishController(RestfulController);

restrant.restful({path: '/api/restful', controller:'restful'}); //for restful syntax sugar

restrant.on({path:'/api/:controller/:id:Integer', action:'selectById'}); //api/sample/123
restrant.on({path:'/api/sample/', controller:'sample', action:'get', method:'GET'}); //api/sample/get
restrant.on({path:'/api/sample/', controller:'sample', action:'post', method:'POST'}); //api/sample/get
restrant.on({path:'/api/:test/multiple/:id', controller:'sample', action:'withparam', method:'POST'}); //api/sample/get
restrant.on({path:'/api/:controller/', action:'test'}); //api/snake_case

restrant.stub({path:'/client.js', namespace:'TESTNS'}); // for browser


//primitive setting to router
var router = restrant.router;


router.push({

    condition:function (req, res) {
        return req.url.indexOf('1') != -1;
    },

    process:function (req, res) {
        res.render('index', { title:'TheFirst' });
    }

});

router.push({

    condition:function (req, res) {
        return req.url.indexOf('2') != -1;
    },

    process:function (req, res) {
        res.render('index', { title:'TheSecond' });
    }

});

router.fullpath('http://localhost:3000/fullpath', function (req, res) {
    res.render('index', { title:'Fullpath:' + this.getFullUrl(req, res) });
});

router.path('/path/:action?abc=:aaa', function(req, res){
    res.render('index', { title:'path:' + '' });
});


exports.index = function (req, res) {

//    console.dir(req);
//    console.log(req.url);
//    console.dir(req.headers);
//    console.log(req.headers.host);

    restrant.execute(req, res);
};