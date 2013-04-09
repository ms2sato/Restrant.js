$(function(){

    var tc = new RESTRANT.SampleController();

    tc.get().then(function(data){
        alert(data.id);
    }, function(xhr){
        console.dir(xhr);
        alert('Error');
    });

    tc.post().then(function(data){
        alert(data.id);
    }, function(xhr){
        console.dir(xhr);
        alert('Error');
    });

});