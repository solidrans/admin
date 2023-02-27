require('../../db_functions');
let md5 = require("md5");
let Admin = require('../../models/Admin');
let Users = require('../../models/Users');
let ObjectId = require('mongodb').ObjectId
var Messages = require("./message");
let jwt = require('jsonwebtoken');
let helpers = require('../../services/helper')
let moment = require('moment');
const nodemailer = require('nodemailer')

const adminUtils = {

    login: async(data) => {
        let { email, password } = data;
        console.log("🚀 ~ file: index.js ~ line 16 ~ login: ~ data", data)

        let query = {
            email,
            password: md5(password),
        }
        let result = await getSingleData(Admin, query, '-password');
        if (result.status) {
            let token = jwt.sign({ admin_id: result.data._id }, process.env.API_SECRET, {
                expiresIn: process.env.JWT_EXPIRY
            });
            let data = { token, time: process.env.JWT_EXPIRY };
            return helpers.showResponse(true, Messages.ADMIN_LOGIN_SUCCESS, data, null, 200);
        }
        return helpers.showResponse(false, Messages.ADMIN_LOGIN_FAILED, null, null, 200);
    },

    forgotPasswordMail: async(data) => {
        let { email } = data;
        let queryObject = { email }
        let result = await getSingleData(Admin, queryObject, '');
        if (result.status) {
            let otp = helpers.randomStr(4, "1234567890");
            let AdminData = {
                otp,
                updated_at: moment().unix()
            }
            let response = await updateData(Admin, AdminData, ObjectId(result.data._id))
            if (response.status) {
                try {
                    let transporter = nodemailer.createTransport({
                        host: "smtp.sendgrid.net",
                        port: 587,
                        secure: false, // true for 465, false for other ports
                        auth: {
                            user: 'apikey',
                            pass: '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'
                        },
                    });
                    await transporter.sendMail({
                        from: '"LonleyAF" <daisylisette879@gmail.com>', // sender address
                        to: email, // list of receivers
                        subject: "Reset Password Instruction", // Subject line
                        html: "<b>Greetings, </b><br /><br />Here is your 4 Digits verification Code<br />" +
                            "<h2>" + otp + "</h2><br /><br /><label><small>Please use this code to change your password." +
                            "</small></label><br /><br /><label>Thanks & Regards</label><br /><label>LonelyAF " +
                            "Community</label>", // html body
                    });
                    return helpers.showResponse(true, Messages.FP_EMAIL_SENT, null, null, 200);
                } catch (err) {
                    return helpers.showResponse(false, Messages.EMAIL_ERROR, err, null, 200);
                }
            }
            return helpers.showResponse(false, Messages.SERVER_ERROR, null, null, 200);
        }
        return helpers.showResponse(false, Messages.INVALID_ADMIN, null, null, 200);
    },

    forgotChangePassword: async(data) => {
        let { otp, email, password } = data;
        let queryObject = { email, otp, status: { $ne: 2 } }
        let result = await getSingleData(Admin, queryObject, '');
        console.log(result);

        if (result.status) {
            let AdminData = {
                otp: 0,
                password: md5(password),
                updated_at: moment().unix()
            }
            let response = await updateData(Admin, AdminData, ObjectId(result.data._id));
            if (response.status) {
                return helpers.showResponse(true, Messages.PASSWORD_CHANGED, null, null, 200);
            }
            return helpers.showResponse(false, Messages.UNABLE_TO_UPDATE_OTP_DB, null, null, 200);
        }
        return helpers.showResponse(false, Messages.INVALID_OTP, null, null, 200);
    },

    changePasswordWithOld: async(data, admin_id) => {
        let { old_password, new_password } = data;
        let result = await getSingleData(Admin, { password: { $eq: md5(old_password) }, _id: ObjectId(admin_id) }, '');
        if (!result.status) {
            return helpers.showResponse(false, Messages.INVALID_OLD, null, null, 200);
        }
        let AdminData = {
            password: md5(new_password),
            updated_at: moment().unix()
        }
        let response = await updateByQuery(Admin, AdminData, { password: { $eq: md5(old_password) }, _id: ObjectId(admin_id) });
        if (response.status) {
            return helpers.showResponse(true, Messages.PASSWORD_CHANGED, null, null, 200);
        }
        return helpers.showResponse(false, Messages.PASSWORD_CHANGE_FAILED, null, null, 200);
    },

    getAdminDetail: async(admin_id) => {
        let result = await getSingleData(Admin, { _id: ObjectId(admin_id) }, '');
        if (result.status) {
            return helpers.showResponse(true, Messages.ADMIN_DATA, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.INVALID_ADMIN, null, null, 200);
    },


    updateAdminDetail: async(data) => {
        let { admin_id, name, email } = data;
        let adminData = {
            name,
            email
        }
        let response = await updateData(Admin, adminData, ObjectId(admin_id));
        if (response.status) {
            return helpers.showResponse(true, Messages.ADMIN_UPDATED, null, null, 200);
        }
        return helpers.showResponse(false, Messages.ADMIN_UPDATE_FAILED, null, null, 200);
    },


    getDashCount: async() => {
        let data = {
            total_patients: 0,
            total_providers: 0,
            total_hospitals: 0,
            total_appointments: 0,
            total_categories: 0
        }
        let patientCount = await getCount(Users, { role: "patient", status: { $ne: 2 } })
        if (patientCount.status) {
            data.total_patients = patientCount.message
        }
        let providerCount = await getCount(Users, { role: "provider", status: { $ne: 2 } })
        if (providerCount.status) {
            data.total_providers = providerCount.message
        }
        let hospitalCount = await getCount(Hospitals, { status: { $ne: 2 } })
        if (hospitalCount.status) {
            data.total_hospitals = hospitalCount.message
        }
        let specsCount = await getCount(Specializations, { status: { $ne: 2 } })
        if (specsCount.status) {
            data.total_categories = specsCount.message
        }
        return helpers.showResponse(true, Messages.DASH_DATA, data, null, 200);
    },


}

module.exports = {
    ...adminUtils
}