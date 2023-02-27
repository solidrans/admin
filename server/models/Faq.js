const mongoose = require('mongoose');
const moment = require('moment')
const Schema = mongoose.Schema;

var faqSchema = new Schema({
    question: {
        type: String,
        default: ''
    },
    answer: {
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

module.exports = mongoose.model('Faq', faqSchema, 'faq')