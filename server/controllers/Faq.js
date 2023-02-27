var Messages = require("../utils/Faq/message");
var Faq = require('../utils/Faq');
var helpers = require('../services/helper')
const sharpFile = require('../services/image_conversion')
const FaqController = {
    //=====================USER APIS=========================
    getAllFaq: async(req, res) => {
        let result = await Faq.getAllFaq();
        return helpers.showOutput(res, result, result.code);
    },

    //=====================ADMIN APIS======================
    getAllFaqAdmin: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.INVALID_ADMIN), 403);
        }
        let result = await Faq.getAllFaqAdmin();
        return helpers.showOutput(res, result, result.code);
    },

    addFaq: async(req, res) => {
        let requiredFields = ['question', 'answer'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }

        let result = await Faq.addFaq(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateFaq: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['_id', 'question', 'answer'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Faq.updateFaq(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    deleteFaq: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Faq.deleteFaq(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateTermsConditions: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['_id', 'type', 'content'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Faq.updateTermsConditions(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    getTermsConditions: async(req, res) => {
        let result = await Faq.getTermsConditions();
        return helpers.showOutput(res, result, result.code);
    },

    addVerificationImages: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        if (!req.files) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.IMAGE_NOT_SELECTED), 403);
        }

        if (req.files.admin_first_image) {
            let converted_image = await sharpFile.convertImageToWebp(req.files.admin_first_image[0]);
            req.body.first_image = converted_image.status?converted_image.data?.Key:"";
        }
        if (req.files.admin_second_image) {
            let converted_image = await sharpFile.convertImageToWebp(req.files.admin_second_image[0]);
            req.body.second_image = converted_image.status?converted_image.data?.Key:"";

            // let admin_second_image = req.files.admin_second_image[0].filename;
            // req.body.second_image = "verification_images/" + admin_second_image;
        }

        let result = await Faq.addVerificationImages(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    getVerificationImages: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let result = await Faq.getVerificationImages();
        return helpers.showOutput(res, result, result.code);
    },

    activateVerificationStatus: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        console.log(req.body._id);
        let result = await Faq.activateVerificationStatus(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    deleteVerificationImage: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        console.log(req.body._id);
        let result = await Faq.deleteVerificationImage(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    //=================REPORT SECTION ==========
    getAllReports : async(req, res)=>{
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let result = await Faq.getAllReports(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    deleteVerificationImage: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        console.log(req.body._id);
        let result = await Faq.deleteVerificationImage(req.body);
        return helpers.showOutput(res, result, result.code);
    },


    //+++++++++++++user api+++++++++++++++++++++
    profileVerificationPoses: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let result = await Faq.profileVerificationPoses();
        return helpers.showOutput(res, result, result.code);
    },


}
module.exports = {
    ...FaqController
}