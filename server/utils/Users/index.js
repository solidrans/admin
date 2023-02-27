require('../../db_functions')
let Users = require('../../models/Users')
let Gallery = require('../../models/Gallery')
let UserNotifications = require('../../models/UserNotificaitons')
let AdminNotification = require('../../models/AdminNotifications')
let SecurityContacts = require('../../models/SecurityContacts')
let Conenctions = require('../../models/Connections')
let BlockUsers = require('../../models/BlockUsers')
let ObjectId = require('mongodb').ObjectId
let jwt = require('jsonwebtoken')
let md5 = require('md5')
let Messages = require("./message");
let nodemailer = require('nodemailer');
let helpers = require('../../services/helper')
let moment = require('moment')
var lodash = require('lodash');


const userUtil = {
    phoneNumberExist: async(data) => {
        let {phone_number}= data;
        let result = await getSingleData(Users, { phone_number: phone_number , is_phone_verified:1,status:{$ne:2}}, '');
        if (result.status) {
            return helpers.showResponse(true, Messages.PHONE_ALREADY_EXIST, null, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },
    userExist: async(user_id) => {
        let result = await getSingleData(Users, { _id: ObjectId(user_id) }, '-password');
        if (result.status) {
            return helpers.showResponse(true, Messages.USER_DATA_FOUND, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

    //Email Functions
    sendOTP: async(country_code, phone) => {
        let otp = helpers.randomStr(4, "1234567890")
        if(phone=="6505553434"){
            otp = 1234
        }
        console.log(otp);
        let result = await Users.findOne({ phone_number: phone, status: { $ne: 2 } }, '');
        if (result) {
            let _id = result._id.toHexString()
            let UserData = {
                otp: otp,
                updated_on: moment().unix()
            }
            let response = await Users.findOneAndUpdate({ _id: ObjectId(_id) }, { $set: UserData }, { new: true });
            if (!response) {
                return helpers.showResponse(false, Messages.SERVER_ERROR, null, null, 200);
            }
            try {
                let message = `${otp} is your OTP .For security reasons,DO NOT share this OTP with anyone.`
            console.log("message", message);
                const phonenumber = country_code + phone;
                const accountSid = process.env.TWILIO_ACCOUNT_SID;
                const authToken = process.env.TWILIO_AUTH_TOKEN;
                const client = require('twilio')(accountSid, authToken);
                client.messages
                    .create({
                        body: message,
                        from: process.env.TWILIO_PHONE_NUMBER,
                        to: phonenumber
                    })
                    .then(message => {
                        console.log("message", message)
                        return helpers.showResponse(true, Messages.OTP_SENT_SUCCESS, response, null, 200);
                    })
                    .catch(error => {
                         console.log("error",error)
                        return helpers.showResponse(false, Messages.OTP_SENT_FAILURE, null, null, 200);
                    })

            } catch (err) {
                console.log(err)
                return helpers.showResponse(false, Messages.OTP_SENT_FAILURE, null, null, 200);
            }
            return helpers.showResponse(true, Messages.OTP_SENT_SUCCESS, response, null, 200);
        }
        return helpers.showResponse(false, Messages.USER_DOESNT_EXIST, null, null, 200);
    },

    //Auth functions
    register: async(data) => {
        console.log("====REGISTER DATAAAAAAA", data);
        let { login_source } = data;
        let key = 1;
        //check the last key in db 
        let all_users = await getDataArray(Users, { status: { $ne: 2 } }, '', null, { key: -1 })
        if (all_users.status) {
            key = all_users.data[0].key + 1;
        }
        if (login_source === "phone") {
            let { phone_number, country_code } = data;
            let queryObject = { phone_number, status: { $ne: 2 } }
            let phone_exist = await getSingleData(Users, queryObject, '');
            if (phone_exist.status) {
                //send OTP
                let otp = await userUtil.sendOTP(country_code, Number(phone_number))
                if (otp.status) {
                    return helpers.showResponse(true, Messages.OTP_SENT_SUCCESS, phone_exist.data, null, 200);
                }
                return helpers.showResponse(true, Messages.OTP_SENT_FAILURE, null, null, 200);
            } else {
                let newObj = {
                    country_code,
                    phone_number,
                    login_source,
                    key,
                    created_at: moment().unix()
                };
                let userRef = new Users(newObj)
                let result = await postData(userRef);
                if (result.status) {
                    let otp = await userUtil.sendOTP(country_code, Number(phone_number))
                    if (otp.status) {
                        return helpers.showResponse(true, Messages.OTP_SENT_SUCCESS, result.data, null, 200);
                    }
                    return helpers.showResponse(true, Messages.OTP_SENT_FAILURE, null, null, 200);
                }
                return helpers.showResponse(false, Messages.OTP_SENT_FAILURE, null, null, 200);
            }
        } else if (login_source === "social") {
            let { email } = data;
            let emailCheck = await getSingleData(Users, { email: { $eq: email }, status: { $ne: 2 } }, '-password');
            if (emailCheck.status) {
                // email already exist
                let userObj = {
                    login_source,
                    updated_on: moment().unix()
                }
                let response = await updateData(Users, userObj, ObjectId(emailCheck.data._id));
                if (response.status) {
                    let token = jwt.sign({ user_id: response.data._id }, process.env.API_SECRET, {
                        expiresIn: process.env.JWT_EXPIRY
                    });
                    let other = { token }

                    let userRes = await userUtil.getUserDetail(emailCheck.data._id)

                    return helpers.showResponse(true, Messages.USER_REGISTER_SUCCESS, userRes.data, other, 200);
                }
                return helpers.showResponse(false, Messages.USER_REGISTER_FAILURE, null, null, 200);
            } else {
                let newObj = {
                    email,
                    login_source,
                    key,
                    created_at: moment().unix()
                };
                let userRef = new Users(newObj)
                let result = await postData(userRef);
                if (result.status) {
                    let token = jwt.sign({ user_id: result.data._id }, process.env.API_SECRET, {
                        expiresIn: process.env.JWT_EXPIRY
                    });
                    let other = { token }

                    let userRes = await userUtil.getUserDetail(result.data._id)

                    return helpers.showResponse(true, Messages.USER_REGISTER_SUCCESS, userRes.data, other, 200);
                }
                return helpers.showResponse(false, Messages.USER_REGISTER_FAILURE, null, null, 200);
            }
        } else if (login_source === "apple") {
            let { auth_token , email} = data;
            // console.log("auth token inside login source apple", data)
            let authTokenCheck = await getSingleData(Users, { auth_token, status: { $ne: 2 } }, '');
            if (authTokenCheck.status) {
                // auth token already exist
                let userObj = {
                    login_source,
                    updated_on: moment().unix()
                }
                let response = await updateData(Users, userObj, ObjectId(authTokenCheck.data._id));
                if (response.status) {
                    let token = jwt.sign({ user_id: response.data._id }, process.env.API_SECRET, {
                        expiresIn: process.env.JWT_EXPIRY
                    });
                    // let response_data = { data: response.data, token };
                    let other = { token }

                    let userRes = await userUtil.getUserDetail(authTokenCheck.data._id)
                    return helpers.showResponse(true, Messages.USER_REGISTER_SUCCESS, userRes.data, other, 200);
                }
                return helpers.showResponse(false, Messages.USER_REGISTER_FAILURE, null, null, 200);
            }
            else{
                let emailCheck = await getSingleData(Users, { email, status: { $ne: 2 } }, '');
                if (emailCheck.status) {
                    // email already exist
                    let userObj = {
                        email,
                        login_source,
                        auth_token,
                        updated_on: moment().unix()
                    }
                    let response = await updateData(Users, userObj, ObjectId(emailCheck.data._id));
                    if (response.status) {
                        let token = jwt.sign({ user_id: response.data._id }, process.env.API_SECRET, {
                            expiresIn: process.env.JWT_EXPIRY
                        });
                        let other = { token }
                        let userRes = await userUtil.getUserDetail(response.data._id)
                        return helpers.showResponse(true, Messages.USER_REGISTER_SUCCESS, userRes.data, other, 200);
                    }
                    return helpers.showResponse(false, Messages.USER_REGISTER_FAILURE, null, null, 200);
                }
                else {
                    console.log("new user", data)
                    let newObj = {
                        email,
                        login_source,
                        auth_token,
                        key,
                        created_at: moment().unix()
                    };
                    let userRef = new Users(newObj)
                    let result = await postData(userRef);
                    if (result.status) {
                        let token = jwt.sign({ user_id: result.data._id }, process.env.API_SECRET, {
                            expiresIn: process.env.JWT_EXPIRY
                        });
                        let other = { token }
                        let userRes = await userUtil.getUserDetail(result.data._id)
                        return helpers.showResponse(true, Messages.USER_REGISTER_SUCCESS, userRes.data, other, 200);
                    }
                    return helpers.showResponse(false, Messages.USER_REGISTER_FAILURE, null, null, 200);
                }
            }
        }
    },

    verifyOtp: async(data) => {
        let { phone_number, otp } = data
        let queryObject = { phone_number, otp };
        let populate = [{
                path: 'connection_type.connection',
                select: 'name'
            }, {
                path: 'interested_in',
                select: 'name'
            }, {
                path: 'gender',
                select: 'name'
            },
            {
                path: 'my_interests.interest',
                select: 'name'
            }
        ]
        let result = await getSingleData(Users, queryObject, '-password', populate);
        if (result.status) {
            //get gallery data
            let res = await userUtil.getUserDetail(result.data._id);
            //update otp to
            let userObj = {
                otp: 0,
                is_phone_verified: 1,
                update_at: moment.unix(),
            }
            let response = await updateData(Users, userObj, result.data._id);
            if (!response.status) {
                return helpers.showResponse(false, Messages.UNABLE_TO_UPDATE_OTP, null, null, 200);
            }

            let token = jwt.sign({ user_id: result.data._id }, process.env.API_SECRET, {
                expiresIn: process.env.JWT_EXPIRY
            });
            let other = { token };
            return helpers.showResponse(true, Messages.OTP_VERIFIED_SUCCESS, res.data, other, 200);
        }
        return helpers.showResponse(false, Messages.OTP_VERIFIED_FAILURE, null, null, 200);
    },

    updateUserDetails: async(data, user_id) => {
        let { email, phone_number , username } = data;
        if (email) {
            //check if email already exist
            let queryObj = {email: email,_id: { $ne: ObjectId(user_id) },status: { $ne: 2 }}
            let user_exist = await getSingleData(Users, queryObj, '')
            if (user_exist.status) {
                return helpers.showResponse(false, Messages.EMAIL_ALREDY_EXIST, null, null, 200);
            }
        }

        if (phone_number) {
            //check if email already exist
            let queryObj = {
                phone_number: phone_number,
                _id: { $ne: ObjectId(user_id) },
                status: { $ne: 2 }
            }
            console.log("phone_query");
            let user_exist = await getSingleData(Users, queryObj, '')
            console.log("phone_exist", user_exist);
            if (user_exist.status) {
                return helpers.showResponse(false, Messages.PHONE_ALREADY_EXIST, null, null, 200);
            }
        }
        if (username) {
            let user_exist = await getSingleData(Users, {_id:ObjectId(user_id)}, '')
            if (user_exist.status) {
                if(username.trim() != user_exist.data.username.trim()){
                    //save notification for admin
                    let notifiyData = {
                        user_id:ObjectId(user_id),
                        message: `${user_exist.data.username} updated username to ${username}`,
                        type: `username_update`,
                        created_at:moment().unix()
                    }

                    let addRef = new AdminNotification(notifiyData);
                    let notify = await postData(addRef)
                }
            }
        }
        
        let response = await updateData(Users, data, ObjectId(user_id));
        if (response.status) {
            let res = await userUtil.getUserDetail(user_id);
            return helpers.showResponse(true, Messages.PROFILE_UPDATE_SUCCESS, res.data, null, 200);
        }
        return helpers.showResponse(false, Messages.PROFILE_UPDATE_FAILURE, null, null, 200);
    },

    updateUserInterestedIn: async(data) => {
        let { user_id, interested_in } = data;
        let interestArray = [];

        let interestType = interested_in.split(',');
        if (interestType.length > 0) {
            for (var i = 0; i < interestType.length; i++) {
                interestArray.push(ObjectId(interestType[i]))
            }
        }

        let result = await Users.findByIdAndUpdate({ _id: ObjectId(user_id) }, { $set: { interested_in: interestArray } })
        if (result) {
            let res = await userUtil.getUserDetail(user_id);
            return helpers.showResponse(true, Messages.INTERESTED_IN_UPDATE_SUCCESS, res.data, null, 200);
        }
        return helpers.showResponse(false, Messages.INTERESTED_IN_UPDATE_FAILURE, null, null, 200);
    },

    updateUserConnectionType: async(data) => {
        let { user_id, connection_type } = data;
        let connectionArray = [];

        let myConnectionType = connection_type.split(',');
        if (myConnectionType.length > 0) {
            for (var i = 0; i < myConnectionType.length; i++) {
                connectionArray.push({ connection: ObjectId(myConnectionType[i]) })
            }
        }
        let result = await Users.findByIdAndUpdate({ _id: ObjectId(user_id) }, { $set: { connection_type: connectionArray } })
        if (result) {
            let res = await userUtil.getUserDetail(user_id);
            return helpers.showResponse(true, Messages.CONNECTION_TYPE_UPDATE_SUCCESS, res.data, null, 200);
        }
        return helpers.showResponse(false, Messages.CONNECTION_TYPE_UPDATE_FAILURE, null, null, 200);
    },

    updateUserInterests: async(data) => {
        let { user_id, interests } = data;
        let interestArray = [];
        if (interests) {
            // let myInterests = interests.split(',');
            let myInterests = JSON.parse(interests)
            if (myInterests.length > 0) {
                for (var i = 0; i < myInterests.length; i++) {
                    interestArray.push({ interest: ObjectId(myInterests[i]._id), sort_order: (i + 1), color: myInterests[i].color })
                }
            }
        }
        let result = await Users.findByIdAndUpdate({ _id: ObjectId(user_id) }, { $set: { my_interests: interestArray } })
        if (result) {
            let res = await userUtil.getUserDetail(user_id);
            return helpers.showResponse(true, Messages.INTERESTS_UPDATE_SUCCESS, res.data, null, 200);
        }
        return helpers.showResponse(false, Messages.INTERESTS_UPDATE_FAILURE, null, null, 200);
    },

    updateUserLocation: async(data) => {
        let { user_id, lat, lng, location, city } = data;
        console.log("updateObj",data)
        let updateObj = {
            lat,
            lng,
            location,
            city,
        }
        if(lng && lat){
            updateObj.location_obj={type:"Point",coordinates:[Number(lng) , Number(lat)]}
        }
        let result = await Users.findOneAndUpdate({_id:ObjectId(user_id),is_location_enabled:1},updateObj, {new:true})
         console.log("result", result)
        if(result){
            let res = await userUtil.getUserDetail(user_id);
            return helpers.showResponse(true, Messages.LOCATION_UPDATE_SUCCESS, res.data, null, 200);
        }
        
        // let result = await updateData(Users, updateObj, ObjectId(user_id));
        // if (result.status) {
        //     let res = await userUtil.getUserDetail(user_id);
        //     return helpers.showResponse(true, Messages.LOCATION_UPDATE_SUCCESS, res.data, null, 200);
        // }
        return helpers.showResponse(false, Messages.LOCATION_UPDATE_FAILURE, null, null, 200);
    },

    enableLocation: async(data) => {
        let { user_id, enable_location } = data;
         console.log("is_enabled===",data);
     
        if(enable_location==0 ){
            let result = await Users.findOneAndUpdate({_id:ObjectId(user_id)}, {is_location_enabled:0, lat:'', lng:'',$unset:{location_obj:1}, updated_at:moment().unix()}, {new:true});
            if (result){
                return helpers.showResponse(true, Messages.LOCATION_UPDATE_SUCCESS, result, null, 200);
            }
            return helpers.showResponse(false, Messages.LOCATION_UPDATE_FAILURE, null, null, 200);
        }
        let result = await Users.findOneAndUpdate({_id:ObjectId(user_id)}, {is_location_enabled:1, updated_at:moment().unix()}, {new:true});
        if (result){
            return helpers.showResponse(true, Messages.LOCATION_UPDATE_SUCCESS, result, null, 200);
        }
        return helpers.showResponse(false, Messages.LOCATION_UPDATE_FAILURE, null, null, 200);
    },

    updateUserFcm: async(data) => {
        let { user_id, notification_status, fcm_token } = data;
        let updateObj = {
            notification_status,
            fcm_token
        }

        let result = await updateData(Users, updateObj, ObjectId(user_id));
        if (result.status) {
            let res = await userUtil.getUserDetail(user_id);
            return helpers.showResponse(true, Messages.NOTIFICATION_STATUS_UPDATE_SUCCESS, res.data, null, 200);
        }
        return helpers.showResponse(false, Messages.NOTIFICATION_STATUS_UPDATE_FAILURE, null, null, 200);
    },

    updateVisibleOnMap: async(data) => {
        let { user_id, visible_on_map } = data;
        let updateObj = {
            visible_on_map,
        }

        let result = await updateData(Users, updateObj, ObjectId(user_id));
        if (result.status) {
            return helpers.showResponse(true, Messages.STATUS_UPDATE_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.STATUS_UPDATE_FAILURE, null, null, 200);
    },

    getUserDetail: async(user_id) => {
        let queryObject = { _id: ObjectId(user_id), status: { $ne: 2 } };
        let populate = [{
                path: 'connection_type.connection',
                select: 'name status'
            }, {
                path: 'interested_in',
                select: 'name status'
            },
            {
                path: 'gender',
                select: 'name parent_id status',
                populate: {
                    path: 'parent_id',
                    select: 'name status'
                }
            },
            {
                path: 'my_interests.interest',
                select: 'name connection_type_id status'
            }
        ]

        let result = await getSingleData(Users, queryObject, '-password', populate);
        if (result.status) {
            //get gallery data 
            let galleryData = await getDataArray(Gallery, { user_id: ObjectId(user_id), status: { $eq: 1 } })
            let temp = {...result.data._doc, gallery: galleryData.status ? galleryData.data : [] }

            // get security contacts
            let security_populate = [{
                path: 'security_user_id',
                select: '_id username profile_pic location bio '
            }]

            let securityData = await getDataArray(SecurityContacts, { user_id: ObjectId(user_id) }, '', null, null, security_populate);
            temp = {...temp, security_contacts: securityData.status ? securityData.data : [] }

            return helpers.showResponse(true, Messages.USER_DATA_FOUND, temp, null, 200);
        }
        return helpers.showResponse(false, Messages.NO_DATA_FOUND, null, null, 200);
    },

    updateUserProfile: async(data) => {
        let response = await updateData(Users, data, data._id);
        if (response.status) {
            return helpers.showResponse(true, Messages.PROFILE_UPDATE_SUCCESS, response.data, null, 200);
        }
        return helpers.showResponse(false, Messages.PROFILE_UPDATE_FAILURE, null, null, 200);
    },

    updateVerificationImages: async(data) => {
        let { user_id, type, first_image, second_image, sample_image_id } = data;
        let userData = {};
        if (type === "profile_verification") {
            userData = {
                updated_at: moment().unix(),
                verification_request_at: moment().unix(),
                profile_verification_images: {
                    first_pose: first_image,
                    second_pose: second_image,
                },
                profile_verification: 2,
                profile_verify_sample_id: ObjectId(sample_image_id)
            }
        } else if (type === "driving_license_verification") {
            userData = {
                updated_at: moment().unix(),
                verification_request_at: moment().unix(),
                driving_verification_images: {
                    front_image: first_image,
                    back_image: second_image,
                },
                driving_license_verification: 2,
            }
        } else if (type === "background_verification") {
            userData = {
                updated_at: moment().unix(),
                verification_request_at: moment().unix(),
                background_check_verification: 2
            }
        }
        console.log(userData);
        let response = await updateData(Users, userData, ObjectId(user_id));
        if (response.status) {
            return helpers.showResponse(true, Messages.PROFILE_VERIFICATION_ADDED_SUCCESS, response.data, null, 200);
        }
        return helpers.showResponse(false, Messages.PROFILE_VERIFICATION_ADDED_FAILURE, null, null, 200);
    },

    getChatUserDetails: async(data) => {
        let { user_id, _id } = data;
        let queryObj = { _id: ObjectId(_id) }
        let response = await getSingleData(Users, queryObj, '_id username profile_pic');
        if (response.status) {
            let temp = {...response.data._doc }

            let user_blocked = await getSingleData(BlockUsers, { blocked_by: ObjectId(user_id), blocked_to: ObjectId(_id) }, '')
            if (user_blocked.status) {
                temp = {...temp, is_blocked: 1 }
            } else {
                temp = {...temp, is_blocked: 0 }
            }
            //check if I am blocked
            let i_blocked = await getSingleData(BlockUsers, { blocked_by: ObjectId(_id), blocked_to: ObjectId(user_id) }, '')
            if (i_blocked.status) {
                temp = {...temp, am_blocked: 1 }
            } else {
                temp = {...temp, am_blocked: 0 }
            }
            return helpers.showResponse(true, Messages.USER_DATA_FOUND, temp, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

    chatWithConnectionOnly: async(data) => {
        let { user_id, status } = data;
        let response = await updateData(Users, { chat_with_connection_only: status }, ObjectId(user_id));
        if (response.status) {
            return helpers.showResponse(true, Messages.STATUS_UPDATE_SUCCESS, response.data, null, 200);
        }
        return helpers.showResponse(false, Messages.STATUS_UPDATE_FAILURE, null, null, 200);
    },

    expireOtp: async(data) => {
        let { phone_number } = data;
        let response = await updateByQuery(Users, { otp: "" }, { phone_number });
        if (response.status) {
            return helpers.showResponse(true, Messages.OTP_EXPIRED_SUCCESS, null, null, 200);
        }
        return helpers.showResponse(false, Messages.OTP_EXPIRED_FAILURE, null, null, 200);
    },
    updateSubscription: async(data) => {
        let { user_id, has_subscribed, subscription_data} = data;
        
        let response = await updateData(Users, { has_subscribed , subscription_data }, ObjectId(user_id));
        if (response.status) {
            return helpers.showResponse(true, Messages.SUBSCRIPTION_PURCHASED_SUCCESS, null, null, 200);
        }
        return helpers.showResponse(false, Messages.SUBSCRIPTION_PURCHASED_FAILURE, null, null, 200);
    },


    //==================++ADMIN APIS++=====================
    getAllUsers: async(data) => {
        let {
            page,
            keyword,
            driving_check,
            driving_not_verifycheck,
            veifyBackgroundCheck,
            notveifyBackgroundCheck,
            profile_check,
            profile_not_verifycheck,
            user_check,
            user_not_verifycheck,
            email_check,
            email_not_verifycheck,
            gender,
            age_range,
            request_approval,
            connection_type,

        } = data;
        let sort = { verification_request_at: -1, created_at: -1 }
        let queryObject = { status: { $ne: 2 } };


        //advance filter

        // driving license check
        if (driving_check && driving_not_verifycheck) {
            // do nothing
        } else if (driving_check) {
            queryObject.driving_license_verification = 1
        } else if (driving_not_verifycheck) {
            queryObject.driving_license_verification = 0
        }

        // profile check
        if (profile_check && profile_not_verifycheck) {
            // do nothing
        } else if (profile_check) {
            queryObject.profile_verification = 1
        } else if (profile_not_verifycheck) {
            queryObject.profile_verification = 0
        }

        // background check 
        if (veifyBackgroundCheck && notveifyBackgroundCheck) {
            // do nothing
        } else if (veifyBackgroundCheck) {
            queryObject.background_check_verification = 1
        } else if (notveifyBackgroundCheck) {
            queryObject.background_check_verification = 0
        }

        // user status  check 
        if (user_check && user_not_verifycheck) {
            // do nothing
        } else if (user_check) {
            queryObject.status = 1
        } else if (user_not_verifycheck) {
            queryObject.status = 0
        }

        // emil check 
        if (email_check && email_not_verifycheck) {
            // do nothing
        } else if (email_check) {
            queryObject.email = { $ne: "" }
        } else if (email_not_verifycheck) {
            queryObject.email = { $eq: "" }
        }

        if (keyword && keyword != "") {
            // sort = {};
            if (keyword.includes("@")) {
                queryObject.$or = [
                    { email: { $regex: '.*' + keyword + '.*', $options: 'i' } },
                ]
            } else {
                queryObject.$or = [
                    { username: { $regex: '.*' + keyword + '.*', $options: 'i' } },
                    // { username: `/^${keyword}` },
                    { phone_number: { $regex: '.*' + keyword + '.*' } },
                ]
            }
        }  

        if (connection_type && connection_type != "") {
            let connArray = [];
            let conenctionTypeArray = JSON.parse(connection_type);
            conenctionTypeArray.forEach(element => {
                connArray.push({ connection_type: { $elemMatch: { connection: ObjectId(element) } } })
            });
            if (connArray.length > 0) {
                queryObject.$or = connArray;
            }
        }
        if (gender && gender != "") {
            queryObject.gender = ObjectId(gender);
        }
        if (age_range) {
            queryObject.age = { $gte: parseInt(age_range[0]), $lte: parseInt(age_range[1]) }
        }
        if (request_approval) {
            queryObject.$or = [{ driving_license_verification: { $eq: 2 } },
                { background_check_verification: { $eq: 2 } },
                { profile_verification: { $eq: 2 } }
            ]
        }
        //console.log("this is query pbject", queryObject);
        
        let populate = [{
                path: 'gender',
                select: 'name parent_id',
                populate: {
                    path: 'parent_id',
                    select: 'name'
                },
            },
            {
                path: 'connection_type.connection',
                select: 'name ',
            },
            {
                path: 'profile_verify_sample_id',
                select: 'first_image second_image',
            }]

        // let pagination = { skip: (page - 1) * 20, limit: 20 }
        // if (keyword || driving_check || background_check || profile_check || user_check || gender) {
        //     pagination = null
        // }
        let count = await Users.find(queryObject).count();


        let result = await getDataArray(Users, queryObject, '-password', null, sort, populate);

        if (result.status) {
            let dat = result.data;
            if (keyword && keyword != "") {
                let userDataArr = [];
                let extrausers = [];
                for (var i = 0; i < result.data.length; i++) {
                    if (result.data[i].username.startsWith(keyword.toUpperCase())) {
                        userDataArr.push(result.data[i]);
                    } else {
                        extrausers.push(result.data[i]);
                    }

                    // console.log(userDataArr);
                }
                dat = userDataArr.concat(extrausers);
            }


            // console.log("=========", dat);
            return helpers.showResponse(true, Messages.USER_DATA_FOUND, dat, count, 200);
        }

        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

    updateUserStatus: async(data) => {
        let { user_id, status } = data;
        let userData = {
            status,
            updated_at: moment().unix()
        }
        let response = await updateData(Users, userData, ObjectId(user_id));
        if (response.status) {
            return helpers.showResponse(true, Messages.STATUS_UPDATE_SUCCESS, response.data, null, 200);
        }
        return helpers.showResponse(false, Messages.STATUS_UPDATE_FAILURE, null, null, 200);
    },

    verifyUserProfile: async(data) => {
        let { user_id, type, status } = data;

        let userData = {
            verification_request_at: 0,
            updated_at: moment().unix()
        }
        if (type == "profile") {
            userData.profile_verification = status; // 1 for verified and 3 for declined
        } else if (type == "driving_license") {
            userData.driving_license_verification = status;
        } else if (type == "background") {
            userData.background_check_verification = status;
        }
        let response = await updateData(Users, userData, ObjectId(user_id));
        if (response.status) {
            //send notification to user for declied 
            let get_user_detail = await getSingleData(Users, { _id: ObjectId(user_id) })
            if (get_user_detail.status) {
                //check if fcm exist 
                let user_fcm = get_user_detail.data.fcm_token;
                // let userfcm_token = [user_fcm]

                let notifData = {
                    userfcm_token: user_fcm,
                    status,
                    type,
                    user_id
                }
                let sendnotification = await userUtil.sendVerificationNotification(notifData)
                if (status == 3) {
                    return helpers.showResponse(true, Messages.DECLINED_SUCCESS, response.data, null, 200);
                } else {
                    return helpers.showResponse(true, Messages.VERIFIED_SUCCESS, response.data, null, 200);
                }
            }
            return helpers.showResponse(false, Messages.VERIFIED_FAILURE, null, null, 200);
        }
    },

    sendVerificationNotification: async(data) => {
        let { userfcm_token, type, status, user_id } = data;
        userfcm_token = [userfcm_token];

        let text = "";
        let verify_type = "";

        if (type == "profile") {
            verify_type = "Profile";
        } else if (type == "driving_license") {
            verify_type = "Driving License";
        } else if (type == "background") {
            verify_type == "Background"
        }
        if (status == 1) {
            // response_text = Messages.VERIFIED_SUCCESS
            text = "Congratulations! Your " + verify_type + " is verified successfully."
        } else if (status == 3) {
            text = "Sorry! Your " + verify_type + " is declined. Kindly resubmit your documents"
        }
        // save data in data base 
        let saveData = {
            user_id: ObjectId(user_id),
            message: text,
            type: "app_notify",
            created_at: moment().unix(),
        }
        let dataRef = new UserNotifications(saveData)
        let result = await postData(dataRef);
        if (result.status) {
            let notifData = {
                title: "Lonely AF",
                body: text,
                data: JSON.stringify({ 'type': "app_notify" })
            }
            let notifResp = await helpers.sendFcmNotification(userfcm_token, notifData);

            return helpers.showResponse(true, Messages.NOTIFICATION_SENT_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.NOTIFICATION_SENT_FAILURE, null, null, 200);


    },

    getChatUserDetailsAdmin: async(data) => {
        let { user_id } = data;
        let populate = [{
            path: 'connection_type.connection',
            select: 'name'
        }, {
            path: 'interested_in',
            select: 'name'
        },
        {
            path: 'gender',
            select: 'name parent_id',
            populate: {
                path: 'parent_id',
                select: 'name'
            }
        },
        {
            path: 'my_interests.interest',
            select: 'name connection_type_id'
        }
    ]
        let result = await getSingleData(Users, { _id: ObjectId(user_id) }, '',populate);
        if (result.status) {
            return helpers.showResponse(true, Messages.USER_DATA_FOUND, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },


    //Delete account 
    deleteAccount: async (data) => {
        let {user_id,delete_reason} = data;
        let result = await updateData(Users,{status:2,delete_reason}, ObjectId(user_id))      
        if (result.data) {

            //delete connection  and blocked users
            let delete_connection = await Conenctions.upadateMany({$or:[{requested_by:ObjectId(user_id)},{requested_to:ObjectId(user_id)}]},{status:"deleted"})
            let delete_blocked = await BlockUsers.upadateMany({$or:[{blocked_by:ObjectId(user_id)},{blocked_to:ObjectId(user_id)}]},{status:2})

            return helpers.showResponse(true, Messages.ACCOUNT_DELETE_SUCCESS, null, null, 200);
        }
        return helpers.showResponse(false, Messages.ACCOUNT_DELETE_FAILURE, null, null, 200);
    },

    //Send Verification code to update phone number 
    sendVerificationCode: async (data) => {
        let {user_id,country_code, phone_number} = data;
        let otp = helpers.randomStr(4, "1234567890")
        if(phone_number=="6505553434"){
            otp = 1234
        }
        let queryObj = {
            phone_number: phone_number,
            _id: { $ne: ObjectId(user_id)},
            status: { $ne: 2 }
        }
        let phone_exist = await getSingleData(Users, queryObj, '')
        if (phone_exist.status) {
            return helpers.showResponse(false, Messages.PHONE_ALREADY_EXIST, null, null, 200);
        }
        let UserData = {
            otp: otp,
            updated_on: moment().unix()
        }
        let response = await Users.findOneAndUpdate({ _id: ObjectId(user_id) }, { $set: UserData }, { new: true });
        if (!response) {
            return helpers.showResponse(false, Messages.SERVER_ERROR, null, null, 200);
        }
        try {
            let message = `${otp} is your OTP .For security reasons,DO NOT share this OTP with anyone.`
            console.log("message", message);
            const phonenumber = country_code + phone_number;
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const client = require('twilio')(accountSid, authToken);
            client.messages
                .create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: phonenumber
                })
                .then(message => {
                    console.log("message", message)
                    return helpers.showResponse(true, Messages.OTP_SENT_SUCCESS, null, null, 200);
                })
                .catch(error => {
                     console.log("error",error)
                    return helpers.showResponse(false, Messages.OTP_SENT_FAILURE, null, null, 200);
                })

        } catch (err) {
            console.log(err)
            return helpers.showResponse(false, Messages.OTP_SENT_FAILURE, null, null, 200);
        }   
        return helpers.showResponse(true, Messages.OTP_SENT_SUCCESS, response, null, 200);    
    },
    verifyVerificationCode: async (data) => {
        let {user_id,otp} = data;
        let verify_otp = await Users.findOneAndUpdate({_id:ObjectId(user_id), otp:otp},{otp:""});
        if(verify_otp){
            return helpers.showResponse(true, Messages.OTP_VERIFIED_SUCCESS, verify_otp, null, 200);  
        }
        return helpers.showResponse(false, Messages.OTP_VERIFIED_FAILURE, null, null, 200);
    },
    expireVerificationCode: async (data) => {
        let {user_id} = data;
        let otp_expire = await Users.findOneAndUpdate({_id:ObjectId(user_id)},{otp:""});
        if(otp_expire){
            return helpers.showResponse(true, Messages.OTP_EXPIRED_SUCCESS, null, null, 200);  
        }
        return helpers.showResponse(false, Messages.OTP_EXPIRED_FAILURE, null, null, 200);
    },

    //send email to client from contact us website
    contactUs: async (data) => {
        let {name, email, message} = data;
        try {
            // console.log("inside try", otp);
            let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                auth: {
                    user: `${process.env.EMAIL}`,
                    pass: `${process.env.APP_PASSWORD}`,
                }
            });
            await transporter.sendMail({
                from: `${process.env.FROM} <${process.env.EMAIL}>`, // sender address
                to:"support@lonleyaf.com", // list of receivers
                subject: "LonelyAF Website-Contact Us", // Subject line
                html:`${message} <br/><br/><br/>Sender' name : ${name}<br/>Sender's Email: ${email}`,
            });
            return helpers.showResponse(true, Messages.MESSAGE_SENT_SUCCESS, null, null, 200);
        } catch (err) {
            console.log(err)
            return helpers.showResponse(false, Messages.MESSAGE_SENT_SUCCESS, null, null, 200);
        }
    }, 
 
}
module.exports = {...userUtil }