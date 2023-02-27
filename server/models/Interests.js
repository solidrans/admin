var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var InterestsSchema = new Schema({
    connection_type_id: {
        type: Schema.Types.ObjectId,
        ref: 'ConnectionType'
    },
    name: {
        type: String,
        default: ''
    },
    sort_order: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        default: 1
    },
    created_at: {
        type: Number,
        default: 0
    },
    updated_at: {
        type: Number,
        default: 0
    }
});
module.exports = mongoose.model('Interests', InterestsSchema, 'interests');