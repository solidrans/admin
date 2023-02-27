var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ConnectionTypeSchema = new Schema({
    name : {
       type : String,
       default:''
    },
    images : [{
        name:{
            type : String,
            default:''
        }
    }],
    status : {
        type : Number,
        default : 1
    },
    created_at : {
        type : Number,
        default:0
    },
    updated_at : {
        type : Number,
        default:0
    }
});
module.exports = mongoose.model('ConnectionType', ConnectionTypeSchema, 'connection_type');