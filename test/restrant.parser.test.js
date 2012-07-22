var should = require("should");
var restrant = require('../index.js');

describe('PathParser', function () {
    describe('.parse', function () {
        it('should parse match string', function () {

            var p = new restrant.Router.PathParser('/test/test1');
            p.parse('/test/test1').should.equal(true);

        });

        it('should not parse match string', function () {

            var p = new restrant.Router.PathParser('/test/test1');
            p.parse('/test/test2').should.equal(false);

        });

        it('should parse string and placeholder', function () {

            var p = new restrant.Router.PathParser('/test/:ph1');
            p.parse('/test/test2').should.equal(true);
            p.placeholders.ph1.should.equal('test2');
        });


        it('should parse query all match', function () {


            var query = {
                test1:'test1',
                test2:123
            };


            var p = new restrant.Router.ParamParser('test1=test1&test2=123');
            p.parse(query).should.equal(true);

        });
    })
})


describe('ParamParser', function () {

    describe('.parse', function () {

        it('should parse query all match', function () {

            var query = {
                test1:'test1',
                test2:123
            };

            var p = new restrant.Router.ParamParser('test1=test1&test2=123');
            p.parse(query).should.equal(true);

        });

        it('should parse query and placeholder', function () {

            var query = {
                test1:'test1',
                test2:'123',
                test3:'iroha'
            };

            var p = new restrant.Router.ParamParser('test1=test1&test2=:param1&test3=:param2');
            p.parse(query).should.equal(true);

            console.dir(p.placeholders);
            p.placeholders.param1.should.equal('123');
            p.placeholders.param2.should.equal('iroha');


        });

        it('should parse query and placeholder with type', function () {

            var query = {
                test1:'test1',
                test2:'123',
                test3:'3.14'
            };

            var p = new restrant.Router.ParamParser('test1=test1&test2=:param1:Integer&test3=:param2:Float');
            p.parse(query).should.equal(true);

            console.dir(p.placeholders);
            p.placeholders.param1.should.equal(123);
            p.placeholders.param2.should.equal(3.14);


        });

        it('should parse query and placeholder with type not match', function () {

            var query = {
                test1:'test1',
                test2:'123',
                test3:'aaaa'
            };

            var p = new restrant.Router.ParamParser('test1=test1&test2=:param1:Integer&test3=:param2:Float');
            p.parse(query).should.equal(false);

        });


    })
})


describe('Router', function () {

    describe('.path', function () {

        it('should dispatch ', function () {

            var router = new restrant.Router();
            router.onNotFound = function () {
                fail('should not reach');
            };

            router.on(
                {
                    path:'/test1/:action?aaa=:param1&bbb=:param2'
                },
                function (req, res) {
                    this.params.action.should.equal('test2');
                    this.params.param1.should.equal('123');
                    this.params.param2.should.equal('456');
                }
            );

            router.execute({
                url:'/test1/test2',
                query:{
                    aaa:'123',
                    bbb:'456'
                }
            });
        });

        it('should dispatch with type', function () {

            var router = new restrant.Router();
            router.onNotFound = function () {
                fail('should not reach');
            };

            router.on(
                {
                    path:'/test1/:action?aaa=:param1:Integer&bbb=:param2:Float'
                },
                function (req, res) {
                    this.params.action.should.equal('test2');
                    this.params.param1.should.equal(123);
                    this.params.param2.should.equal(456.7);
                }
            );

            router.execute({
                url:'/test1/test2',
                query:{
                    aaa:'123',
                    bbb:'456.7'
                }
            });
        });

        it('should not dispatch with method missmatch', function () {

            var router = new restrant.Router();
            router.onNotFound = function () {
                //success
            };

            router.on(
                {
                    path:'/test1/:action?aaa=:param1:Integer&bbb=:param2:Float',
                    method: 'post'
                },
                function (req, res) {
                    should.fail('should not reach');
                }
            );

            router.execute({
                url:'/test1/test2',
                method: 'GET', //get is not handled
                query:{
                    aaa:'123',
                    bbb:'456.7'
                },
                headers:{
                    host: 'localhost'
                }
            });
        });

        it('should dispatch with type onPost', function () {

            var router = new restrant.Router();
            router.onNotFound = function () {
                fail('should not reach');
            };

            router.on(
                {
                    path:'/test1/:action?aaa=:param1:Integer&bbb=:param2:Float',
                    method: 'post'
                },
                function (req, res) {
                    this.params.action.should.equal('test2');
                    this.params.param1.should.equal(123);
                    this.params.param2.should.equal(456.7);
                }
            );

            router.execute({
                url:'/test1/test2',
                method: 'POST',
                body:{
                    aaa:'123',
                    bbb:'456.7'
                }
            });
        });

    });

    it('should dispatch simple path', function () {

        var router = new restrant.Router();
        router.onNotFound = function () {
            fail('should not reach');
        };

        router.on({path:'/test1/:action'}, function (req, res) {
            this.params.action.should.equal('test2');
        });

        router.execute({
            url:'/test1/test2',
            query:{
                aaa:'123',
                bbb:'456.7'
            }
        });
    });
});