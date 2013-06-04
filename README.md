# これは何ですか？
node.jsでサーバとクライアントを繋ぐ通信の部分で楽をする為のライブラリです。
RoRのroute.rbのような記述をすることでリクエストをコントローラに定義したアクションへマッピングします
（URLだけではなく、リクエストパラメータやポストパラメータもパターン情報に使います）。

# どんな機能がありますか？
 * サーバー側のコントローラーを通信用スタブクラスとしてクライアント用のJSファイルとして生成します。
 * RestfulなURLの公開が簡単に行えます。これにより、Backbone.jsのsyncの機能と相性が良いです。
 * MongooseのSchema情報を元にBackbone.jsからモデルまで通して生成される仕組みを作成中です
    （仕様が固まっていないので大きく変更される可能性があります）。

# 何に依存していますか？
 * underscore
 * node-promise
 * mongoose
 * express（expressのroutesの置き換えを目指していますが、今はroutesから呼ぶ形式になっています。middlewareを書けば良さそうですが手が回っていません）

# 簡単なルート定義の例はありますか？
例えば以下のような感じになります。

    var restrant = new Restrant();

    // 利用されるコントローラを読み込む
    var SampleController = require('../app/controller/sample_controller').SampleController;
    var SnakeCaseController = require('../app/controller/snake_case_controller').SnakeCaseController;
    var RestfulController = require('../app/controller/restful_controller').RestfulController;
    var MongooseController = require('../app/controller/mongoose_controller').MongooseController;

    // 公開コントローラと、コントローラのラベルを指定します（省略可）
    // コントローラの実装についてはサンプルから辿って下さい。
    restrant.publishController('sample', SampleController); //with keyname
    restrant.publishController(SnakeCaseController); // keyname = snake_case
    restrant.publishController(RestfulController);
    restrant.publishController(MongooseController);

    // Restfulにしたければrestfulメソッドを呼びます。一般的なリクエストに対応できるはずです。
    restrant.restful({path: '/api/restful', controller:'restful'}); //for restful syntax sugar
    restrant.restful({path: '/api/mongoose', controller: 'mongoose'}); //for mongoose mixed in controller

    //
    restrant.on({path:'/api/:controller/:id:Integer', action:'selectById'}); //api/sample/123
    restrant.on({path:'/api/sample/', controller:'sample', action:'get', method:'GET'}); //api/sample/get
    restrant.on({path:'/api/sample/', controller:'sample', action:'post', method:'POST'}); //api/sample/get
    restrant.on({path:'/api/:test/multiple/:id', controller:'sample', action:'withparam', method:'POST'}); //api/sample/get
    restrant.on({path:'/api/:controller/', action:'test'}); //api/snake_case

    // create stub
    restrant.stub({path:'/client.js', namespace:'TESTNS'}); // for browser


# 簡単なコントローラの例はありますか？
Restful対応する為のコントローラは下記のようになります。

    function RestfulController(req, res) {
        this.req = req;
        this.res = res;
    }

    _.extend(RestfulController.prototype, {

        doGet: function(params){
            // 好きな処理を入れて下さい。プロミスを返すか、レスポンスを返して下さい。
            return promise.delay(1).then(function(){
                return {id:'GET:' + params.id};
            });
        },

        doPost: function(params){
            // 好きな処理を入れて下さい。プロミスを返すか、レスポンスを返して下さい。
            return promise.delay(1).then(function(){
                return {id:'POSTED'};
            });
        },

        doPut: function(params){
            // 好きな処理を入れて下さい。プロミスを返すか、レスポンスを返して下さい。
            return promise.delay(1).then(function(){
                return {put: 'already put'};
            });
        },

        doDelete: function(params){
            // 好きな処理を入れて下さい。プロミスを返すか、レスポンスを返して下さい。
            return promise.delay(1).then(function(){
                return {delete: 'success'};
            });
        }
    });
