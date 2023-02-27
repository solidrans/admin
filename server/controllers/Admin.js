var Messages = require("../utils/Admin/message");
var Admin = require('../utils/Admin');
var helpers = require('../services/helper')

const adminController = {

    login: async(req, res) => {
        let requiredFields = ['email', 'password'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Admin.login(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    forgotPasswordMail: async(req, res) => {
        let requiredFields = ['email'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Admin.forgotPasswordMail(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    forgotChangePassword: async(req, res) => {
        let requiredFields = ['otp', 'email', 'password'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Admin.forgotChangePassword(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    changePasswordWithOld: async(req, res) => {
        let requiredFields = ['old_password', 'new_password'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.INVALID_ADMIN), 403);
        }
        let result = await Admin.changePasswordWithOld(req.body, admin_id);
        return helpers.showOutput(res, result, result.code);
    },


    updateAdminDetail: async(req, res) => {
        let requiredFields = ['name', 'email'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.INVALID_ADMIN), 403);
        }
        req.body.admin_id = admin_id;
        let result = await Admin.updateAdminDetail(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    getAdminDetail: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.INVALID_ADMIN), 403);
        }
        let result = await Admin.getAdminDetail(admin_id);
        return helpers.showOutput(res, result, result.code);
    },

}
module.exports = {
    ...adminController
}