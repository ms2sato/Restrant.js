/*
 * GET home page.
 */
var restrant = require('../../index.js');
var Router = restrant.Router;

exports.index = function (req, res) {

//    console.dir(req);
    console.log(req.url);
    console.dir(req.headers);
    console.log(req.headers.host);


    var router = new Router();
    router.push({

        condition:function (req, res) {
            return req.url.indexOf('1') != -1;
        },

        process:function () {
            res.render('index', { title:'TheFirst' });
        }

    });

    router.push({

        condition:function (req, res) {
            return req.url.indexOf('2') != -1;
        },

        process:function () {
            res.render('index', { title:'TheSecond' });
        }

    });

    router.fullpath('http://localhost:3000/fullpath', function (req, res) {
        res.render('index', { title:'Fullpath:' + this.getFullUrl(req, res) });
    });

    router.execute(req, res);
};