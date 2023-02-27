var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const moment = require('moment')
var adminNotificationSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    message: {
        type: String,
        default: ""
    },
    read_status: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        default: ""
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
module.exports = mongoose.model('AdminNotifications', adminNotificationSchema, 'admin_notifications');