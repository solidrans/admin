require('../../db_functions')
let BlockUsers = require('../../models/BlockUsers')
let SecurityContacts = require('../../models/SecurityContacts')
let Users = require('../../models/Users')
let Messages = require("./message");
let helpers = require('../../services/helper')
let ObjectId = require('mongodb').ObjectId
let moment = require('moment');

const BlockUserUtils = {
    blockUser: async(data) => {
        let { user_id, block_user_id, type, report_reason } = data
        let newObj = {
            blocked_by: user_id,
            blocked_to: block_user_id,
        };
        if(type=="report"){
            newObj.type="report";
        }
        if(report_reason && report_reason!=""){
            newObj.report_reason= report_reason;
        }
        //check if user is already blocked
        let exist = await getSingleData(BlockUsers, { blocked_by: ObjectId(user_id), blocked_to: ObjectId(block_user_id)})
        if (exist.status) {
            if(exist?.data?.type=="report"){
                return helpers.showResponse(true, Messages.REPORTED_SUCCESS, exist.data, null, 200);
            }
            else{
                let result = await deleteData(BlockUsers, newObj)
                if (result.status) {
                    return helpers.showResponse(true, Messages.UNBLOCKED_SUCCESS, null, null, 200);
                }
                return helpers.showResponse(false, Messages.UNBLOCKED_FAILURE, null, null, 200);
            }
        }
        else {
            let dataRef = new BlockUsers(newObj)
            let result = await postData(dataRef);
            if (result.status) {
                let message = Messages.BLOCKED_SUCCESS
                if(type=="report"){
                    message = Messages.REPORTED_SUCCESS
                }
                return helpers.showResponse(true, message, result.data, null, 200);
            }
            return helpers.showResponse(false, Messages.BLOCKED_FAILURE, null, null, 200)
        };
    },
    unblockUser: async(data) => {
        let { user_id, block_user_id } = data
        let queryObj = {
            blocked_by: user_id,
            blocked_to: block_user_id,
        };
        console.log("queryObj====", queryObj)
        let result = await deleteData(BlockUsers, queryObj)
        console.log("result blocked", result);
        if (result.status) {
            return helpers.showResponse(true, Messages.UNBLOCKED_SUCCESS, null, null, 200);
        }
        return helpers.showResponse(false, Messages.UNBLOCKED_FAILURE, null, null, 200);
    },
    getBlockedUser: async(data) => {
        let { user_id } = data;
        let populate = [{
            path: 'blocked_by',
            select: 'phone_number username email age profile_pic location'
        }, {
            path: 'blocked_to',
            select: 'phone_number username email age profile_pic location'
        }]
        let result = await getDataArray(BlockUsers, { blocked_by: ObjectId(user_id), status: 1 }, '', null, { created_at: -1 }, populate);
        console.log(result);
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(true, Messages.NO_DATA_FOUND, [], null, 200);
    },
    getMyContactUsers: async(data) => {
        let { user_id, user_contacts, user_phone_number } = data;
        let contactArray = user_contacts.split(",")
        let unique = [...new Set(contactArray)];

        contactArray = unique.filter(item => item !== user_phone_number)
        let newPhoneArray = [];
        for (var u = 0; u < contactArray.length; u++) {
            newPhoneArray.push(contactArray[u].substr(contactArray[u].length - 10))
        }

        let result = await getDataArray(Users, { phone_number: { $in: newPhoneArray }, status: 1 }, '_id phone_number  username profile_pic bio occupation', null, { created_at: -1 });
        if (result.status) {
            let temp = []
            //get security contacts
            let security_contacts = await getDataArray(SecurityContacts, { user_id: ObjectId(user_id) }, '');
            if (security_contacts.status) {
                // console.log(security_contacts.data[0])
                let securityArray = [];
                for (var j = 0; j < security_contacts.data.length; j++) {
                    securityArray.push(security_contacts.data[j].security_user_id.toHexString());
                }
                console.log("=====", securityArray);
                console.log("=====", result.data);

                for (var i = 0; i < result.data.length; i++) {
                    if (securityArray.includes(result.data[i]._id.toHexString())) {
                        temp.push({...result.data[i]._doc,
                            is_alredy_added: 1
                        })
                    } else {
                        temp.push({...result.data[i]._doc,
                            is_alredy_added: 0
                        })
                    }
                }

            }else {
                for (var i = 0; i < result.data.length; i++) {
                    temp.push({...result.data[i]._doc,
                        is_alredy_added: 0
                    })

                }
            }

            //get my security contacts
            // let temp = [...result.data,
            //     is_alredy_added: 0
            // ]
            // result.data.map(obj => ({...result.data, is_alredy_added: 0 }))

            // let security_contacts = await getDataArray(SecurityContacts, { user_id: ObjectId(user_id) }, 'phone_number');
            // if (security_contacts.status) {
            //     // for (var i = 0; i < temp.length; i++) {
            //     //     if (temp.includes("Mango"))
            //     // }
            // }

            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, temp, null, 200);
        }
        return helpers.showResponse(true, Messages.NO_DATA_FOUND, [], null, 200);
    },   
    addSecurityContacts: async(data) => {
        let { user_id, user_ids } = data;
        if (user_ids != "") {
            let userArray = user_ids.split(",")
                //delete old security contacts
            let del = await deleteData(SecurityContacts, { user_id: ObjectId(user_id) });

            let dataArray = [];
            for (var i = 0; i < userArray.length; i++) {
                dataArray.push({ user_id: ObjectId(user_id), security_user_id: ObjectId(userArray[i]) })
            }
            let result = await insertMany(SecurityContacts, dataArray);
            if (result.status) {
                return helpers.showResponse(true, Messages.ADDED_SUCCESS, result.data, null, 200);
            }
            return helpers.showResponse(false, Messages.ADDED_FAILURE, null, null, 200);
        } else {
            let del = await deleteData(SecurityContacts, { user_id: ObjectId(user_id) });
            if (del.status) {
                return helpers.showResponse(true, Messages.REMOVED_SUCCESS, [], null, 200);
            }
            return helpers.showResponse(false, Messages.REMOVED_FAILURE, null, null, 200);
        }

    },
}
module.exports = {...BlockUserUtils }