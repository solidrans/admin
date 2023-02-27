const mongoose = require('mongoose');
const moment = require('moment')
const Schema = mongoose.Schema;

var adminSchema = new Schema({
    email: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        default: ''
    },
    otp: {
        type: Number,
        default: 0
    },
    profile_pic: {
        type: String,
        default: ''
    },
    status: {
        type: Number,
        default:1
    },
    created_on: {
        type: Number,
        default: moment().unix()
    }
});

module.exports = mongoose.model('Admin', adminSchema, 'admin')