var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var IntrestedInSchema = new Schema({
    name : {
       type : String,
       default:''
    },
    parent_id : {
        type: Schema.Types.ObjectId, 
        ref: 'InterestedIn'
    },
    status : {
        type : Number,
        default : 1
    },
    icon : {
        type : String,
        default : ''
    },
    is_child: {
        type: Number,
        default: 0
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
module.exports = mongoose.model('InterestedIn', IntrestedInSchema, 'interested_in');