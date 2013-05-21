$(function () {

    function log(str, model) {
        try {
            str += (model) ? ' : ' + JSON.stringify(model.toJSON()) : '';
        } catch (ex) {
        }
        $('#output').append('<li>' + str + '</li>');
    }


    var Entity = Backbone.Model.extend({
        urlRoot: '/api/restful',
        idAttribute: 'id'
    });

    function createEntity(options){
        var entity = new Entity(options);
        entity.set('myname', 'TestName');
        entity.on('sync', function (attr) {
            log('sync', this);
            next();
        });

        entity.on('change', function () {
            log('change', this);

            if(scene == 1){
                next();
            }
        });
        return entity;
    }


    var entity = createEntity();

    var scene = 0;
    var stories = [
        function () {
            log('save', entity);
            entity.save();
        },

        function(){
            log('edit property')
            entity.set('myname', 'MyNewName');
        },

        function(){
            log('save', entity);
            entity.save();
        },

        function(){
            log('delete', entity);
            entity.destroy();
        },

        function(){
            log('save', entity);
            entity.save();
        },

        function(){
            log('fetch');
            entity = createEntity({id: '123'});
            entity.fetch();
        }

    ];

    function next() {
        if(!stories.length){
            log('story end');
            return;
        }

        scene++;
        stories.shift()();
    }

    log('story start');
    next();

});