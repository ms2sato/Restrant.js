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
            log('sync event', this);

            if(scene == 2 || scene == 3 || scene == 4 || scene == 5){
                next();
            }
        });

        entity.on('change', function () {
            log('change event', this);

            if(scene == 1){
                next();
            }
        });

        entity.on('remove', function () {
            log('remove event', this);
        });

        entity.on('error event', function(err){
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
            log('edit property and save')
            entity.save({myname: 'MyNewName'});
        },

        function(){
            log('delete', entity);
            entity.destroy({success: function(model, response) {
                log('delete success handler');
            }});
        },

        function(){
            log('create');
            entity = createEntity();
            entity.save();
        },

        function(){
            var opt = {};
            opt[idAttribute] = entity.get(idAttribute);

            var newEntity = createEntity(opt);
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