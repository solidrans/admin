var mongoose = require('mongoose');
const moment = require('moment')
var Schema = mongoose.Schema;
var verificationImagesScheme = new Schema({
    first_image: {
        type: String,
        default: ''
    },
    second_image: {
        type: String,
        default: ''
    },
    is_active: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        default: "profile_verification"
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
module.exports = mongoose.model('VerificationImages', verificationImagesScheme, 'verification_images');