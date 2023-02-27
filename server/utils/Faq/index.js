require('../../db_functions')
let Faq = require('../../models/Faq')
let TermsConditions = require('../../models/TermsConditions')
let Messages = require("./message");
let helpers = require('../../services/helper')
const VerificationImages = require('../../models/VerificationImages')
let ObjectId = require('mongodb').ObjectId
let moment = require('moment');
const BlockUsers = require('../../models/BlockUsers');

const FaqUtils = {
    //=======================USER API==========================================
    getAllFaq: async() => {
        let result = await getDataArray(Faq, { status: { $eq: 1 } }, '');
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

    //==================+++ADMIN APIS==============================================
    getAllFaqAdmin: async() => {
        let result = await getDataArray(Faq, { status: { $ne: 2 } }, '', null, { created_at: -1 });
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

    addFaq: async(data) => {
        let { question, answer } = data
        let newObj = {
            question,
            answer,
        };
        let dataRef = new Faq(newObj)
        let result = await postData(dataRef);
        if (result.status) {
            return helpers.showResponse(true, Messages.FAQ_ADDED_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.FAQ_ADDED_FAILURE, null, null, 200);
    },

    updateFaq: async(data) => {
        let { _id, question, answer } = data;
        let uData = {
            question,
            answer,
            updated_at: moment().unix()
        }
        let response = await updateData(Faq, uData, ObjectId(_id));
        if (response.status) {
            return helpers.showResponse(true, Messages.FAQ_UPDATE_SUCCESS, response.data, null, 200);
        }
        return helpers.showResponse(false, Messages.FAQ_UPDATE_FAILURE, null, null, 200);
    },

    deleteFaq: async(data) => {
        let { _id } = data;
        let uData = {
            status: 2,
            updated_at: moment().unix()
        }
        let response = await updateData(Faq, uData, ObjectId(_id));
        if (response.status) {
            return helpers.showResponse(true, Messages.FAQ_DELETE_SUCCESS, response.data, null, 200);
        }
        return helpers.showResponse(false, Messages.FAQ_DELETE_FAILURE, null, null, 200);
    },

    updateTermsConditions: async(data) => {
        let { _id, type, content } = data;
        let uData = {
            updated_at: moment().unix()
        }
        if (type == "terms_conditions") {
            uData.terms_conditions = content;
        } else if (type == "privacy") {
            uData.privacy_policy = content;
        } else if (type == 'safety_feature') {
            uData.safety_feature = content;
        }
        let response = await updateData(TermsConditions, uData, ObjectId(_id));
        if (response.status) {
            return helpers.showResponse(true, Messages.UPDATED_SUCCESS, response.data, null, 200);
        }
        return helpers.showResponse(false, Messages.UPDATE_FAILURE, null, null, 200);
    },

    getTermsConditions: async(data) => {
        let response = await getDataArray(TermsConditions, {}, '');
        if (response.status) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, response.data[0], null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },
    getVerificationImages: async(data) => {
        let response = await getDataArray(VerificationImages, { status: { $eq: 1 } }, '', null, { created_at: -1 });
        if (response.status) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, response.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

    addVerificationImages: async(data) => {
        let { first_image, second_image } = data;
        let userData = {
            first_image,
            second_image,
            is_active: 1,
            created_at: moment().unix(),
        };
        let dataRef = new VerificationImages(userData)
        let result = await postData(dataRef);
        if (result.status) {
            let response = await updateByQuery(VerificationImages, { is_active: 0 }, { _id: { $ne: ObjectId(result.data._id) } });
            if (response.status) {
                return helpers.showResponse(true, Messages.VERIFICATION_IMAGE_ADDED_SUCCESS, response.data, null, 200);
            }
            return helpers.showResponse(false, Messages.VERIFICATION_IMAGE_ADDED_FAILURE, null, null, 200);
        }
    },

    activateVerificationStatus: async(data) => {
        let { _id } = data;
        let userData = {
            is_active: 1,
            updated_at: moment().unix(),
        };
        let response = await updateData(VerificationImages, userData, ObjectId(_id));
        if (response.status) {
            //set other as 0 
            let activate = await updateByQuery(VerificationImages, { is_active: 0 }, { _id: { $ne: ObjectId(_id) } });

            return helpers.showResponse(true, Messages.ACTIVATED_SUCCESS, null, null, 200);
        }
        return helpers.showResponse(false, Messages.ACTIVATED_FAILURE, null, null, 200);
    },
    deleteVerificationImage: async(data) => {
        let { _id } = data;
        let userData = {
            status: 2,
            updated_at: moment().unix(),
        };
        let response = await updateData(VerificationImages, userData, ObjectId(_id));
        if (response.status) {
            return helpers.showResponse(true, Messages.DELETED_SUCCESS, null, null, 200);
        }
        return helpers.showResponse(false, Messages.DELETED_FAILURE, null, null, 200);
    },
    getAllReports: async(data) => {
        let result = await BlockUsers.aggregate([
            {$match:{type:"report", status:1}},
            {$lookup:{
                from:"users",
                localField:"blocked_by",
                foreignField:"_id",
                as:"reported_by",
                pipeline:[{$project:{username:1}}]
            }},
            {$lookup:{
                from:"users",
                localField:"blocked_to",
                foreignField:"_id",
                as:"reported_to",
                pipeline:[{$project:{username:1}}]
            }}
        ])
        if (result.length>0) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

    //user api
    profileVerificationPoses: async(data) => {
        let response = await getSingleData(VerificationImages, { type: "profile_verification", is_active: 1 }, '');
        if (response.status) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, response.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

}
module.exports = {...FaqUtils }