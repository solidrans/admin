var mongoose = require('mongoose');
var Schema = mongoose.Schema;
let moment = require('moment');
var blockUserSchema = new Schema({
    blocked_by: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    blocked_to: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    type: {
        type: String,
        default: 'blocked'
    },
    report_reason: {
        type: String,
        default: ''
    },
    status: {
        type: Number,
        default: 1
    },
    created_at: {
        type: Number,
        default: moment().unix()
    },
    updated_at: {
        type: Number,
        default: moment().unix()
    }
});
module.exports = mongoose.model('BlockUsers', blockUserSchema, 'block_users');