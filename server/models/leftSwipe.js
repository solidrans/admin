var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var leftSwipeScheme = new Schema({
    rejected_to : {
        type: Schema.Types.ObjectId, 
        ref: 'Users'
    },
    rejected_by: {
        type: Schema.Types.ObjectId, 
        ref: 'Users'
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
module.exports = mongoose.model('leftSwipe', leftSwipeScheme, 'left_swipe');