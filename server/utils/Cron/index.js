require('../../db_functions')
let leftSwipe = require('../../models/leftSwipe')
    // let Messages = require("./message");
let helpers = require('../../services/helper')
let ObjectId = require('mongodb').ObjectId
let moment = require('moment');

const cronUtils = {
    deleteleftSwipeAfterWeek: async() => {
        let last_week = moment().subtract(7, 'days')
        let last_week_timestamp = moment(last_week).unix();

        let queryObj = { created_at: { $lt: last_week_timestamp } }
        console.log(queryObj);
        let result = await leftSwipe.deleteMany(queryObj);
        if (result) {
            return helpers.showResponse(true, "Deleted Successfully", null, null, 200);
        }
        return helpers.showResponse(false, "Unable to delete", null, null, 200);

    },

}
module.exports = {...cronUtils }