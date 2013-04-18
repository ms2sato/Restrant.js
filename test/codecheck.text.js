var restrant = require('../index.js');
var ClassCodeGenerator = restrant.ClassCodeGenerator;
var ClientSourceCodeGenerator = restrant.ClientSourceCodeGenerator;


var metadata = {
    controller: 'test',
    action: 'doIt',
    path: '/api/sample/:id/?data=:data&value=:value'
};

var generator = new ClassCodeGenerator(metadata);

var header = generator.createHeader();
console.log(header);

var cls = generator.createClass(metadata);
console.log(cls);

var func = generator.createFunction(metadata);
console.log(func);

var footer = generator.createFooter();
console.log(footer);



var cscg = new ClientSourceCodeGenerator();
cscg.push({
    controller: 'test',
    action: 'doIt',
    path: '/api/sample/:id/?data=:data&value=:value'
});
cscg.push({
    controller: 'test',
    action: 'access',
    path: '/api/sample/:id/aaa'
});
cscg.push({
    controller: 'test',
    method: 'POST',
    action: 'access',
    path: '/api/sample/:id'
});

cscg.push({
    controller: 'test',
    method: 'POST',
    action: 'access',
    path: '/api/sample/:test/id/:id'
});


console.log(cscg.getCode());
