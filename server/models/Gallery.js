const mongoose = require('mongoose');
const moment = require('moment')
const Schema = mongoose.Schema;

var gallerySchema = new Schema({
    media: {
        type: String,
        default: ''
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    status: {
        type: Number,
        default: 1
    },
    is_profile: {
        type: Number,
        default: 0
    },
    media_type: {
        type: String,
        default: ''
    },
    thumbnail: {
        type: String,
        default: ''
    },
    sort_order: {
        type: Number,
        default: 0
    },
    compress_image: {
        type: String,
        default: ''
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

module.exports = mongoose.model('Gallery', gallerySchema, 'gallery')