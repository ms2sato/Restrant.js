/*
 * GET home page.
 */
var restrant = require('../../index.js');
var Router = restrant.Router;

var router = new Router();
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
    console.log(req.url);
    console.dir(req.headers);
    console.log(req.headers.host);

    router.execute(req, res);
};