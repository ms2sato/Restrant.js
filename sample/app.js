/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    //app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});


var TEST_DB = 'mongodb://localhost/restranttest';
var mongoose = require('mongoose');
mongoose.connect(TEST_DB)
mongoose.connection.on('open',function () {

    var EntryEntity = require('./app/model/entry').EntryEntity;

    // remove all entry entity
    EntryEntity.remove({}, function () {
        app.listen(3000, function () {
            console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
        });
    });

}).on('error', function (err) {
        if (err) {
            throw new Error('Error in (' + TEST_DB + ')');
        }

        console.error('Loading failed');
    });

// Routes

app.get('/client.js', routes.index);
app.all('/api/*', routes.index);

app.get('/', function (req, res) {
    res.render('index', { title: 'Sample' });
});

app.get('/stub', function (req, res) {
    res.render('stub', { title: 'Stub' });
});

app.get('/backbone', function (req, res) {
    res.render('backbone', { main: 'backbone' });
});
app.get('/mongoose', function (req, res) {
    res.render('backbone', { main: 'mongoose' });
});


