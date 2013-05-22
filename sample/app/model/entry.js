var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var EntrySchema = new Schema({
    appid: {type: String, require: true, index: true}, //application ID

    myname: {type: String},

    createdAt: {type: Date, 'default': Date.now},
    updatedAt: {type: Date, 'default': Date.now}
});

var EntryEntity = mongoose.model('Entry', EntrySchema);

exports.EntryEntity = EntryEntity;