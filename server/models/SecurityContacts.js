var mongoose = require('mongoose');
var Schema = mongoose.Schema;
let moment = require('moment');
var secirtyContactSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    security_user_id: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
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
module.exports = mongoose.model('SecurityContacts', secirtyContactSchema, 'security_contacts');