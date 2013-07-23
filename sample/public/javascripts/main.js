$(function(){

    var tc = new TESTNS.SampleController();

    tc.get().then(function(data){
        alert(data.id);
    }, function(res){
        console.dir(res);
        alert('Error');
    });

    tc.post({
        test: 123,
        name: 'abc'
    }).then(function(data){
        alert(data.id);
    }, function(res){
        console.dir(res);
        alert('Error');
    });

});