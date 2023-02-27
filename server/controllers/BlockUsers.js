var Messages = require("../utils/Faq/message");
var BlockUsers = require('../utils/BlockUsers');
var helpers = require('../services/helper')
const BlockController = {
    //=====================USER APIS=========================
    getBlockedUser: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        req.body.user_id = user_id;
        let result = await BlockUsers.getBlockedUser(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    blockUser: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['block_user_id',];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }

        req.body.user_id = user_id;
        let result = await BlockUsers.blockUser(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    unblockUser: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['block_user_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        console.log("inside unblock user");
        req.body.user_id = user_id;
        let result = await BlockUsers.unblockUser(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    //=====================SECURITY CONTACT======================================
    getMyContactUsers: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['user_contacts', 'user_phone_number'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = user_id;
        let result = await BlockUsers.getMyContactUsers(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    addSecurityContacts: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        // let requiredFields = ['user_ids'];
        // let validator = helpers.validateParams(req, requiredFields);
        // if (!validator.status) {
        //     return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        // }
        req.body.user_id = user_id;
        let result = await BlockUsers.addSecurityContacts(req.body);
        return helpers.showOutput(res, result, result.code);
    },





}
module.exports = {
    ...BlockController
}