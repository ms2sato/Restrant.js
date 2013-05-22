function createStory(urlRoot, idAttribute){

    function log(str, model) {
        try {
            str += (model) ? ' : ' + JSON.stringify(model.toJSON()) : '';
        } catch (ex) {
        }
        $('#output').append('<li>' + str + '</li>');
    }


    var Entity = Backbone.Model.extend({
        urlRoot: urlRoot,
        idAttribute: idAttribute
    });

    function createEntity(options){
        var entity = new Entity(options);
        entity.set('myname', 'TestName');
        entity.on('sync', function (attr) {
            log('sync', this);

            if(scene == 2 || scene == 3 || scene == 4 || scene == 5){
                next();
            }
        });

        entity.on('change', function () {
            log('change', this);

            if(scene == 1){
                next();
            }
        });

        entity.on('error', function(err){
            log('error', err);
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
            entity.save({myname: 'MyNewName'});
        },

        function(){
            log('delete', entity);
            entity.destroy();
        },

        function(){
            entity = createEntity();
            entity.save();
        },

        function(){
            var newEntity = createEntity({_id: entity.get('_id')});
            log('fetch: ', newEntity);
            newEntity.fetch();
        }

    ];

    function next() {
        if(!stories.length){
            log('story end');
            return;
        }

        setTimeout(function(){
            scene++;
            stories.shift()();
        },0);
    }


    return {
        start: function(){
            log('story start');
            next();
        }
    }

}