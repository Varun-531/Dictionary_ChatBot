const {Schema,model} = require('mongoose')

const DataSchema = new Schema({
    Word : {
        type : String
    },
    Definition : {
        type : String
    },
    Example : {
        type : String
    },
    Audio : {
        type : String
    },
    Date : {
        type : Date,
        default : Date.now
    },
})

const DataModel = model('data',DataSchema);

module.exports = DataModel;