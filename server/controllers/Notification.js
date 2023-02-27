var Notificaiton = require('../utils/Notification');
var Cron = require('../utils/Cron');
var helpers = require('../services/helper')

const notificationController = {
    sendPayloadNotifcaiotn: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, "Invalid User"), 403);
        }
        let requiredFields = ['user_id', 'payload'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Notificaiton.sendPayloadNotifcaiotn(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    getUserNotifications: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, "Invalid User"), 403);
        }
        req.body.user_id = _id;
        let result = await Notificaiton.getUserNotifications(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    getUnreadCount: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, "Invalid User"), 403);
        }
        req.body.user_id = _id;
        let result = await Notificaiton.getUnreadCount(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    //============================SEND ADMIN NOTIFICARIONS===========================
    sendAdminNotification: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.INVALID_ADMIN), 403);
        }
        let requiredFields = ['userArray', 'message'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Notificaiton.sendAdminNotification(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    getAdminNotificationList: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.INVALID_ADMIN), 403);
        }
         req.body.admin_id = admin_id
        let result = await Notificaiton.getAdminNotificationList(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    getAdminUnreadNotificationList: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.INVALID_ADMIN), 403);
        }
         req.body.admin_id = admin_id
        let result = await Notificaiton.getAdminUnreadNotificationList(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    clearAllNotifications: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.INVALID_ADMIN), 403);
        }
         req.body.admin_id = admin_id
        let result = await Notificaiton.clearAllNotifications(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    markAllRead: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.INVALID_ADMIN), 403);
        }
         req.body.admin_id = admin_id
        let result = await Notificaiton.markAllRead(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    deleteUser: async(req, res) => {

        let result = await Cron.deleteleftSwipeAfterWeek(req.body);
        return helpers.showOutput(res, result, result.code);
    },
}

module.exports = {
    ...notificationController
}