require('../../db_functions')
let Faq = require('../../models/Faq')
let Users = require('../../models/Users')
let ConnectionType = require('../../models/ConnectionType')
let InterestedIn = require('../../models/InterestedIn')
let Interests = require('../../models/Interests')
let Messages = require("./message");
let helpers = require('../../services/helper')
let ObjectId = require('mongodb').ObjectId
let moment = require('moment');

const  dashboardUtils= {
    getDashboardData:async()=>{
        let data = {
            total_users:0,
            total_connection_type:0,
            total_interests:0,
            total_interested_in:0,
        }
        let result = await getDataArray(Users,{status:{$ne:2}, is_phone_verified:1},'');
        if (result.status) {
            data.total_users = result.data.length;
        }

        let connection_type = await getDataArray(ConnectionType,{status:{$ne:2}},'');
        if (connection_type.status) {
            data.total_connection_type = connection_type.data.length;
        }

        let interests = await getDataArray(Interests,{status:{$ne:2}},'');
        if (interests.status) {
            data.total_interests = interests.data.length;
        }

        let interested_in = await getDataArray(InterestedIn,{status:{$ne:2},is_child:0},'');
        if (interested_in.status) {
            data.total_interested_in = interested_in.data.length;
        }

        return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, data, null, 200);
    },  
}
module.exports = { ...dashboardUtils }