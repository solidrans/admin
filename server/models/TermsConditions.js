const mongoose = require('mongoose');
const moment = require('moment')
const Schema = mongoose.Schema;

var termsSchema = new Schema({
    terms_conditions: {
        type: String,
        default: ''
    },
    privacy_policy: {
        type: String,
        default: ''
    },
    safety_feature: {
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

module.exports = mongoose.model('TermsConditions', termsSchema, 'terms_conditions')