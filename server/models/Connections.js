var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var connectionSchema = new Schema({
    requested_by: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    requested_to: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    status: {
        type: String,
        default: 'pending'
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
module.exports = mongoose.model('Connections', connectionSchema, 'connections');