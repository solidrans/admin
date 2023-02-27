require('../../db_functions')
let InterestedIn = require('../../models/InterestedIn')
let Interests = require('../../models/Interests')
let ConnectionType = require('../../models/ConnectionType')
let Messages = require("./message");
let helpers = require('../../services/helper')
let ObjectId = require('mongodb').ObjectId
let moment = require('moment');


const interestedInUtils = {
    //=================interested in======================= 

    //==================+++ADMIN APIS==============================================
    //interested in
    getAllInterestedInAdmin: async () => {
        let result = await getDataArray(InterestedIn, { is_child: { $eq: 0 }, status: { $ne: 2 } }, '');
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },
    getInterestedInSubcategory: async (data) => {
        let { _id } = data;
        let result = await getDataArray(InterestedIn, { parent_id: ObjectId(_id), status: { $eq: 1 } }, '');
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },
    addInterestedIn: async (data) => {
        let { name, icon } = data
        let newObj = {
            name,
            icon,
            created_at: moment().unix()
        };
        let dataRef = new InterestedIn(newObj)
        let result = await postData(dataRef);
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_ADDED_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_ADDED_FAILURE, null, null, 200);
    },
    addInterestedInSubcategory: async (data) => {
        let { _id, name } = data
        let newObj = {
            name,
            parent_id: ObjectId(_id),
            is_child: 1,
            created_at: moment().unix()
        };
        let dataRef = new InterestedIn(newObj)
        let result = await postData(dataRef);
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_ADDED_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_ADDED_FAILURE, null, null, 200);
    },
    updateInterestedInStatus: async (data) => {
        let { _id, status } = data;
        let uData = {
            status,
            updated_at: moment().unix()
        }
        let response = await updateData(InterestedIn, uData, ObjectId(_id));
        if (response.status) {
            return helpers.showResponse(true, Messages.STATUS_UPDATE_SUCCESS, response.data, null, 200);
        }
        return helpers.showResponse(false, Messages.STATUS_UPDATE_FAILURE, null, null, 200);
    },
    updateInterestedIn: async (data) => {
        let { _id, name, icon } = data;
        let uData = {
            name,
            updated_at: moment().unix()
        }
        if (icon && icon != "") {
            uData.icon = icon;
        }
        let response = await updateData(InterestedIn, uData, ObjectId(_id));
        if (response.status) {
            return helpers.showResponse(true, Messages.DATA_UPDATE_SUCCESS, response.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_UPDATE_FAILURE, null, null, 200);
    },
    getAllGenders: async () => {
        let response = await getDataArray(InterestedIn, { is_child: { $eq: 0 }, status: { $eq: 1 } }, '');
        if (response.status) {
            let genderArray = [];
            for (var i = 0; i < response.data.length; i++) {
                //get child of each user
                let res = await getDataArray(InterestedIn, { parent_id: ObjectId(response.data[i]._id), status: { $eq: 1 } })
                console.log("==result", res);
                if (res.status) {
                    res.data.forEach(element => {
                        genderArray.push(element);
                    });
                } else {

                    genderArray.push(response.data[i]);
                }
            }
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, genderArray, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },
    //interests
    getAllInterestsAdmin: async (data) => {
        let { connection_type_id } = data;
        let queryObject = { status: { $ne: 2 } }
        let sort = { sort_order: 1 }
        if (connection_type_id != "all") {
            queryObject.connection_type_id = ObjectId(connection_type_id);
            let count = await Interests.find(queryObject).count();
            let result = await getDataArray(Interests, queryObject, '', null, sort);
            if (result.status) {
                return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.data, count, 200);
            }
            return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
        } else {
            //get all connections
            let cData = await getDataArray(ConnectionType, { status: { $ne: 2 } }, '')
            if (cData.status) {
                let connectionArray = [];
                for (var i = 0; i < cData.data.length; i++) {
                    let intData = await getDataArray(Interests, { connection_type_id: ObjectId(cData.data[i]._id) }, '', null, { sort_order: 1 });
                    connectionArray = [...connectionArray, ...intData.data];
                }
                if (connectionArray.length > 0) {
                    return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, connectionArray, connectionArray.length, 200);
                }
                return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);

            }
        }
    },

    addInterest: async (data) => {
        let { name, connection_type_id } = data
        // get interest of connection type
        let sort_order = 1;
        let conn_type = await getDataArray(Interests, { connection_type_id: ObjectId(connection_type_id), status: { $ne: 2 } }, '', null, { sort_order: -1 })
        if (conn_type.status) {
            sort_order = parseInt(conn_type.data[0].sort_order) + 1;
        }
        console.log("sort_order", sort_order);
        let newObj = {
            name,
            sort_order,
            connection_type_id: ObjectId(connection_type_id),
            created_at: moment().unix()
        };
        let dataRef = new Interests(newObj)
        let result = await postData(dataRef);
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_ADDED_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_ADDED_FAILURE, null, null, 200);
    },

    updateInterest: async (data) => {
        let { _id, name } = data
        let updateObj = {
            name,
            // connection_type_id,
            update_at: moment().unix()
        }
        let update = await updateData(Interests, updateObj, ObjectId(_id))
        if (update.status) {
            return helpers.showResponse(true, Messages.INTEREST_UPDATE_SUCCESSS, update.data, null, 200);
        }
        return helpers.showResponse(false, Messages.INTEREST_UPDATE_FAILURE, null, null, 200);
    },

    updateInterestStatus: async (data) => {
        let { _id, status } = data
        let updateObj = {
            status,
            update_at: moment().unix()
        }
        let update = await updateData(Interests, updateObj, ObjectId(_id))
        if (update.status) {
            return helpers.showResponse(true, Messages.STATUS_UPDATE_SUCCESS, update.data, null, 200);
        }
        return helpers.showResponse(false, Messages.STATUS_UPDATE_FAILURE, null, null, 200);
    },
    //collection type
    getAllConnectionTypesAdmin: async () => {
        let queryObject = { status: { $ne: 2 } }
        let result = await getDataArray(ConnectionType, queryObject, '');
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

    addConnectionType: async (data) => {
        let { name, images } = data;
        let connectionData = {
            name,
            images
        }
        let dataRef = new ConnectionType(connectionData);
        let result = await postData(dataRef);
        if (result.status) {
            return helpers.showResponse(true, Messages.CONNECTION_ADDED_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.CONNECTION_ADDED_FAILURE, null, null, 200);
    },

    editConnectionType: async (data) => {
        let { connection_id, name } = data;
        let connectionData = {
            name,
            updated_at: moment().unix()
        }
        let update = await updateData(ConnectionType, connectionData, ObjectId(connection_id))
        if (update.status) {
            return helpers.showResponse(true, Messages.CONNECTION_TYPE_UPDATE_SUCCESS, update.data, null, 200);
        }
        return helpers.showResponse(false, Messages.CONNECTION_TYPE_UPDATE_FAILURE, null, null, 200);
    },

    deleteConnectionImage: async (data) => {
        let { connection_id, image_id } = data;
        let update = await ConnectionType.updateOne({ _id: ObjectId(connection_id) }, { $pull: { images: { _id: ObjectId(image_id) } } })
        if (update) {
            return helpers.showResponse(true, Messages.CONNECTION_IMAGE_REMOVED_SUCCESS, null, null, 200);
        }
        return helpers.showResponse(false, Messages.CONNECTION_IMAGE_REMOVED_FAILURE, null, null, 200);
    },

    editConnectionImage: async (data) => {
        let { connection_id, image_id, image } = data;

        let imageObj = {
            "images.$.name": image,
        }
        let update = await ConnectionType.findOneAndUpdate({ _id: ObjectId(connection_id), "images._id": ObjectId(image_id) }, { $set: imageObj })
        if (update) {
            return helpers.showResponse(true, Messages.CONNECTION_IMAGE_UPDATE_SUCCESS, null, null, 200);
        }
        return helpers.showResponse(false, Messages.CONNECTION_IMAGE_UPDATE_FAILURE, null, null, 200);
    },

    addConnectionImage: async (data) => {
        let { connection_id, image } = data;
        let update = await ConnectionType.updateOne({ _id: ObjectId(connection_id) }, { $push: { images: { name: image } } })
        if (update) {
            return helpers.showResponse(true, Messages.CONNECTION_IMAGE_ADD_SUCCESS, null, null, 200);
        }
        return helpers.showResponse(false, Messages.CONNECTION_IMAGE_ADD_FAILURE, null, null, 200);
    },
    addConnectionDetail: async (data) => {
        let { connection_id } = data;
        let result = await getSingleData(ConnectionType, { _id: ObjectId(connection_id) }, '')
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },
    dragDropConnectionImages: async (data) => {
        let { connection_id, connection_images } = data;
        connection_images = JSON.parse(connection_images);
        // console.log("connection images in utils==============",connection_id , connection_images)
        let result = await updateData(ConnectionType, { images: connection_images }, ObjectId(connection_id))
        if (result.status) {
            return helpers.showResponse(true, Messages.UPDATE_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.UPDATE_FAILURE, null, null, 200);
    },
    //=======================USER API==============================
    getAllInterests_All: async (data) => {
        let { connection_type_id } = data;
        if (connection_type_id == "all") {
            let cData = await getDataArray(ConnectionType, { status: { $ne: 2 } }, '')
            if (cData.status) {
                let connectionArray = [];
                let populate_conn = [{
                    path: "connection_type_id",
                    select: "-_id name",
                }]
                for (var i = 0; i < cData.data.length; i++) {
                    let intData = await getDataArray(Interests, { connection_type_id: ObjectId(cData.data[i]._id) }, '', null, { sort_order: 1 }, populate_conn);
                    if (intData.status) {
                        connectionArray = [...connectionArray, ...intData.data];
                    }

                }
                if (connectionArray.length > 0) {
                    return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, connectionArray, connectionArray.length, 200);
                }
                return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
            }
        } else {
            let connectionArray = [];
            let connectionTypes = connection_type_id.split(',');
            console.log("connectionTypes", connectionTypes);
            for (var i = 0; i < connectionTypes.length; i++) {
                let intData = await getDataArray(Interests, { connection_type_id: ObjectId(connectionTypes[i]) }, '', null, { sort_order: 1 });
                if (intData.status) {
                    connectionArray = [...connectionArray, ...intData.data];
                }
                // connectionArray = [...connectionArray, ...intData.data];
            }
            if (connectionArray.length > 0) {
                return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, connectionArray, connectionArray.length, 200);
            }
            return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);

        }

    },
    getAllInterests: async (data) => {
        let { connection_type_id } = data;
            let conn_arr = connection_type_id.split(',');

        let arr = []
        for(let i =0 ;i<conn_arr.length;i++){
            arr.push(ObjectId(conn_arr[i]))
        }
        let q = { _id: { $in: arr}, status: 1 };

        let result = await ConnectionType.aggregate([
            { $match: q },
            {
                $lookup: {
                    from: 'interests',
                    localField: "_id",
                    foreignField: "connection_type_id",
                    as: "interest_data",
                    pipeline:[{$sort:{sort_order:1}}]
                }
            },
            {$project:{name:1,interest_data:1}}
        ])
        console.log("result", result);
        
        return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result, null, 200);
        // for (var i = 0; i < connectionTypes.length; i++) {
        //     let intData = await getDataArray(Interests, { connection_type_id: ObjectId(connectionTypes[i]) }, '', null, { sort_order: 1 });
        //     if (intData.status) {
        //         connectionArray = [...connectionArray, ...intData.data];
        //     }
        //     // connectionArray = [...connectionArray, ...intData.data];
        // }
        // if (connectionArray.length > 0) {
        //     return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, connectionArray, connectionArray.length, 200);
        // }
        // return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);



    },

    getAllConnectionTypes: async () => {
        let queryObject = { status: { $eq: 1 } }
        let result = await getDataArray(ConnectionType, queryObject, '');
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

    getAllInterestedIn: async () => {
        let result = await getDataArray(InterestedIn, { is_child: { $eq: 0 }, status: { $eq: 1 } }, '');
        if (result.status) {
            let resultData = [];
            for (var i = 0; i < result.data.length; i++) {
                let sub_cat = await getDataArray(InterestedIn, { parent_id: ObjectId(result.data[i]._id), status: { $eq: 1 } }, '')
                let temp = { ...result.data[i]._doc, sub_cat: sub_cat.status ? sub_cat.data : [] }
                resultData.push(temp)
            }
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, resultData, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },
    updateInterestSortOrder: async (data) => {
        let { connection_id, interestArray } = data;
        interestArray = JSON.parse(interestArray);
        let result = await getDataArray(Interests, { connection_type_id: ObjectId(connection_id), status: { $ne: 2 } }, '')
        if (result.status) {
            console.log(result.data);
            for (var i = 0; i < result.data.length; i++) {
                for (var j = 0; j < interestArray.length; j++) {
                    // console.log("=i", result.data[i]._id.toHexString());

                    if (result.data[i]._id.toHexString() == interestArray[j]._id) {
                        console.log(interestArray[j]);
                        let update = await updateData(Interests, { sort_order: (j + 1) }, ObjectId(result.data[i]._id))
                        console.log(update);
                        break;
                    }
                }
            }
            return helpers.showResponse(true, Messages.ORDER_UPDATE_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.ORDER_UPDATE_FAILURE, null, null, 200);
    },
    deleteConnectionType: async (data) => {
        let { connection_id} = data;
        let result = await updateData(ConnectionType, { status:2, updated_at:moment().unix()}, ObjectId(connection_id))
        if (result.status) {
            return helpers.showResponse(true, Messages.CONNECTION_DELETE_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.CONNECTION_DELETE_FAILURE, null, null, 200);
    },
}
module.exports = { ...interestedInUtils }