require('../../db_functions')
let Users = require('../../models/Users')
let UsersNotfications = require('../../models/UserNotificaitons')
let AdminNotfications = require('../../models/AdminNotifications')
let Messages = require("./message");
let helpers = require('../../services/helper')
let ObjectId = require('mongodb').ObjectId
let moment = require('moment');

const notifyUtils = {
    sendPayloadNotifcaiotn: async(data) => {
        let { user_id, payload } = data;
        console.log("===============user-id", user_id);
        console.log("===============payload", payload);
        let queryObject = { _id: ObjectId(user_id), status: { $eq: 1 } }
        let result = await getSingleData(Users, queryObject, '');
        if (result.status) {
            let fcm_token = result.data.fcm_token;
            console.log("fcm_tokennnn", fcm_token);
            if (fcm_token != "") {
                let userfcm_token = [fcm_token]
                    // console.log("payload", payload.tit)
                let notifData = {
                        title: payload.title,
                        body: payload.body,
                        data: payload.data
                    }
                    // console.log("================",notifData);
                let notifResp = await helpers.sendNewCurlNotification(userfcm_token, notifData);
                // console.log("================",notifResp);
            }
            return helpers.showResponse(true, "Notification Success", null, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

    getUserNotifications: async(data) => {
        let { user_id } = data;
        let queryObject = { user_id: ObjectId(user_id), status: { $eq: 1 } }
        let result = await getDataArray(UsersNotfications, queryObject, '', null, { created_at: -1 });
        if (result.status) {
            //update read status
            let update = await updateByQuery(UsersNotfications, { read_status: 1 }, { user_id: ObjectId(user_id) })

            return helpers.showResponse(true, Messages.NOTIFICATION_LIST_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.NOTIFICATION_LIST_FAILURE, null, null, 200);
    },

    getUnreadCount: async(data) => {
        let { user_id } = data;
        let queryObject = { user_id: ObjectId(user_id), status: { $eq: 1 }, read_status: { $eq: 0 } }
            // console.log(queryObject);
        let count = await getDataArray(UsersNotfications, queryObject, '_id')
            // console.log(count);
            // if (count.status) {
        return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, count.status ? count.data.length : 0, null, 200);
        // }

    },

    //=====================================ADMIN API=====================================
    sendAdminNotification: async(data) => {
        let { message, userArray } = data;
        userArray = JSON.parse(userArray);
        console.log("userArray", userArray);
        // userArray = [{ _id: ObjectId("61d968c2a0e6285c1f72f88f"), fcm: "f9Z8l1YbckPgl_hPY1IndT:APA91bEbV-U758AJJ-7iUMzYWuzSFKOKVuJhL4RXYEUKL4dXGrqlVMQBSBiax-D6L_b49gq5O2P6ivePw-hYIyNbf81eWziuZJySevn__ZzxMlscrNT_5UMwqbh8bAZhwcoNZmELQ_hM" }]
        let notificationArray = [];
        let fcmArray = [];
        for (var i = 0; i < userArray.length; i++) {
            if (userArray[i].fcm != "") {
                notificationArray.push({
                    user_id: ObjectId(userArray[i].user_id),
                    message: message,
                    type: "admin_notification",
                    created_at: moment().unix()
                })
                fcmArray.push(userArray[i].fcm)
            }
        }
        console.log("notificationArray", notificationArray);
        // insert data in notification table
        let result = await insertMany(UsersNotfications, notificationArray);
        if (result.status) {
            let notifData = {
                title: "LonelyAF",
                body: message,
                data: { 'type': "app_notify" }
            }
            let notifResp = await helpers.sendNewCurlNotification(fcmArray, notifData);
            return helpers.showResponse(true, Messages.NOTIFICATION_SENT_SUCCESS, null, null, 200);
        }
        return helpers.showResponse(false, Messages.NOTIFICATION_SENT_FAILURE, null, null, 200);
    },

    getAdminNotificationList: async(data) => {
        let result = await AdminNotfications.aggregate([
            {$match:{status:1}},
            {$lookup:{
                from:"users",
                localField:"user_id",
                foreignField:"_id",
                as:"user_data",
                pipeline:[{$project:{username:1}}]
            }},
            {$sort:{created_at:-1}}
        ])
         console.log("result", result)
        if(result.length>0){
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },
    getAdminUnreadNotificationList: async(data) => {
        let result = await AdminNotfications.aggregate([
            {$match:{status:1,read_status:0}},
        ])
         console.log("result", result)

        return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result, null, 200);
      
    },
    clearAllNotifications: async(data) => {
        let result = await AdminNotfications.updateMany({},{status:2})
        if(result){
            return helpers.showResponse(true, Messages.NOTIFICATION_CLEAR_SUCCESS, result, null, 200);
        }
        return helpers.showResponse(false, Messages.NOTIFICATION_CLEAR_FAILURE, null, null, 200);
    },
    markAllRead: async(data) => {
        let result = await AdminNotfications.updateMany({},{read_status:1})
        if(result){
            return helpers.showResponse(true, Messages.NOTIFICATION_CLEAR_SUCCESS, result, null, 200);
        }
        return helpers.showResponse(false, Messages.NOTIFICATION_CLEAR_FAILURE, null, null, 200);
    }
}

module.exports = {...notifyUtils }