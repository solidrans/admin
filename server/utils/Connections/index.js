require('../../db_functions')
let leftSwipe = require('../../models/leftSwipe')
let Users = require('../../models/Users')
let Gallery = require('../../models/Gallery')
let Connections = require('../../models/Connections')
let BlockUsers = require('../../models/BlockUsers')
let ObjectId = require('mongodb').ObjectId
let jwt = require('jsonwebtoken')
let md5 = require('md5')
let Messages = require("./message");
let nodemailer = require('nodemailer');
let helpers = require('../../services/helper')
let moment = require('moment')
let lodash = require('lodash')

const connectionUtil = {
    //=======Home screen Apis=============
    getHomeConnections: async(data) => {
        console.log("====>", data);
        let { user_id, page, interested_in, connection_type, profile_verification, background_check_verification, driving_license_verification, filter_lat, filter_lng, filter_distance, min_age, max_age , isGlobal } = data;
        let user_lat = '';
        let user_lng = '';
        let user_interested_in = '';
        let user_connection_type = '';

        //get user lat long 
        let user_detail = await getSingleData(Users, { _id: ObjectId(user_id) })
        if (user_detail.status) {
            let userconnarray = [];
            for (var i = 0; i < user_detail.data.connection_type.length; i++) {
                userconnarray.push(user_detail.data.connection_type[i].connection)
            }
            user_lat = user_detail.data.lat;
            user_lng = user_detail.data.lng;
            user_interested_in = user_detail.data.interested_in.join(',');
            user_connection_type = userconnarray.join(',');
        }
        if(filter_lat && filter_lng && filter_lng!="" && filter_lat!=""){
            user_lat = filter_lat
            user_lng = filter_lng
        }

        // get rejected users
        let rejectedArray = [];
        let rejectQuery = { rejected_by: ObjectId(user_id) }
        let rejected = await getDataArray(leftSwipe, rejectQuery, 'rejected_to');
        if (rejected.status) {
            rejected.data.forEach(element => {
                rejectedArray.push(element.rejected_to);
            });
        }

        // get connected users
        let connectedArray = [];
        let connectedQuery = { $or: [{ requested_by: ObjectId(user_id) }, { requested_to: ObjectId(user_id) }], status: { $ne: "rejected" } }
        let connected = await getDataArray(Connections, connectedQuery, '');
        if (connected.status) {
            connected.data.forEach(element => {
                if (element.requested_to.toHexString() == user_id && element.status == "connected") {
                    console.log("inside if")
                    connectedArray.push(element.requested_by);
                } else {
                   
                    connectedArray.push(element.requested_to);
                }

            });
        }

        // get blocked users users
        let blockedQuery = { blocked_by: ObjectId(user_id) }
        let blocked = await getDataArray(BlockUsers, blockedQuery, 'blocked_to');
        if (blocked.status) {
            blocked.data.forEach(element => {
                connectedArray.push(element.blocked_to);
            });
        }
        //merege rejected and connection
        let rejectedConnectedUsers = rejectedArray.concat(connectedArray)


        //get users as per req
        let queryObject = { _id: { $ne: ObjectId(user_id) }, status: { $eq: 1 } };
        if(rejectedConnectedUsers.length>0){
                rejectedConnectedUsers.push(ObjectId(user_id))
                queryObject._id = {$nin:rejectedConnectedUsers}
                console.log("rejectedConnectedUsers", rejectedConnectedUsers)
        }
        let interestedArray = []
        if (interested_in && interested_in != "") {
            let interestedInArray = interested_in.split(',');
            interestedInArray.forEach(element => {
                interestedArray.push({ gender: ObjectId(element) })
            })
            queryObject.$or = interestedArray;
        } else if (user_interested_in != "") {
            let  interestedInArray = user_interested_in.split(',');
             interestedInArray.forEach(element => {
                interestedArray.push({ gender: ObjectId(element) })
            })
            queryObject.$or = interestedArray;
        }
        let connArray = []
        if (connection_type && connection_type != "") {

            let conenctionTypeArray = connection_type.split(',');
            conenctionTypeArray.forEach(element => {
                connArray.push({ connection_type: { $elemMatch: { connection: ObjectId(element) } } })
            });
        } else if (user_connection_type != "") {
           let  conenctionTypeArray = user_connection_type.split(',');
            conenctionTypeArray.forEach(element => {
                connArray.push({ connection_type: { $elemMatch: { connection: ObjectId(element) } } })
            });
        }
        //query 
        queryObject.$and = [
            { $or: interestedArray },
            { $or: connArray }
        ]
        if (min_age && max_age && min_age != "" && max_age != "") {
            queryObject.age = { $gte: parseInt(min_age), $lte: parseInt(max_age) }
        }
        if (profile_verification != "" && profile_verification == 1) {
            queryObject.profile_verification = parseInt(profile_verification)
        }
        if (background_check_verification != "" && background_check_verification == 1) {
            queryObject.background_check_verification = parseInt(background_check_verification)
        }
        if (driving_license_verification != "" && driving_license_verification == 1) {
            queryObject.driving_license_verification = parseInt(driving_license_verification)
        }

        let max_distance = 4 * 1609.344
        if(filter_distance && filter_distance!="" ){
            max_distance = Number(filter_distance) * 1609.344
        }

        /***************WHEN USER HAS ITS LOCATION ENABLED****************************** */
        if(user_lat!="" && user_lng!=""){
          console.log("==========User has enabled location===============")
            let geoQueryObj = {
                "query":  queryObject ,
                "near": {
                    "type": "Point",
                    "coordinates": [Number(user_lng), Number(user_lat)]
                },
                "distanceField": "distance",
                "spherical": true,
                "maxDistance": Number(max_distance)
            }
            if(isGlobal){
                if(isGlobal==true || isGlobal=='true'){
                    geoQueryObj = {
                        "query":  queryObject ,
                        "near": {
                            "type": "Point",
                            "coordinates": [Number(user_lng), Number(user_lat)]
                        },
                        "distanceField": "distance",
                        "spherical": true,
                    }
                }
            }
    
            let result = await Users.aggregate(
                [   {
                        $geoNear: geoQueryObj
                    },
                    { '$sort': { 'created_at': -1 } },
                    {
                        $lookup: {
                            from: "gallery",
                            let: { user_id: "$_id" },
                            pipeline: [
                                { $match: { $and: [{ $expr: { $eq: ["$user_id", "$$user_id"] } }, { status: { $ne: 2 } }] } },
                                { $project: { _id: 1, is_profile: 1, media: 1, media_type: 1, thumbnail: 1 } }
                            ],
                            as: "gallery"
                        },
                    },
                    {
                        $lookup: {
                            from: "interests",
                            localField: "my_interests.interest",
                            foreignField: "_id",
                            as: "my_hobbies"
                        }
                    },
                    {
                        $lookup: {
                            from: "connection_type",
                            localField: "connection_type.connection",
                            foreignField: "_id",
                            as: "connection_type"
                        }
                    },
            ]);
    
            let total_users = result;
    
            if(isGlobal && isGlobal==true || isGlobal=='true'){
                queryObject.lat = ''
                queryObject.lng = ''
                let disabled_location_users =  await Users.aggregate(
                    [   {
                           $match:queryObject
                        },
                        { '$sort': { 'created_at': -1 } },
                        {
                            $lookup: {
                                from: "gallery",
                                let: { user_id: "$_id" },
                                pipeline: [
                                    { $match: { $and: [{ $expr: { $eq: ["$user_id", "$$user_id"] } }, { status: { $ne: 2 } }] } },
                                    { $project: { _id: 1, is_profile: 1, media: 1, media_type: 1, thumbnail: 1 } }
                                ],
                                as: "gallery"
                            },
                        },
                        {
                            $lookup: {
                                from: "interests",
                                localField: "my_interests.interest",
                                foreignField: "_id",
                                as: "my_hobbies"
                            }
                        },
                        {
                            $lookup: {
                                from: "connection_type",
                                localField: "connection_type.connection",
                                foreignField: "_id",
                                as: "connection_type"
                            }
                        },
                ]);
    
                 console.log("disabled_location_users",disabled_location_users)
                total_users = total_users.concat(disabled_location_users);
            }
            let others = { next_page: false }
            return helpers.showResponse(true, Messages.USER_DATA_FOUND, total_users, others, 200);
        }

        else{
            console.log("*****************USERS LOCATION IS DISBLED***************")
            let result =  await Users.aggregate(
                [   {
                       $match:queryObject
                    },
                    { '$sort': { 'created_at': -1 } },
                    {
                        $lookup: {
                            from: "gallery",
                            let: { user_id: "$_id" },
                            pipeline: [
                                { $match: { $and: [{ $expr: { $eq: ["$user_id", "$$user_id"] } }, { status: { $ne: 2 } }] } },
                                { $project: { _id: 1, is_profile: 1, media: 1, media_type: 1, thumbnail: 1 } }
                            ],
                            as: "gallery"
                        },
                    },
                    {
                        $lookup: {
                            from: "interests",
                            localField: "my_interests.interest",
                            foreignField: "_id",
                            as: "my_hobbies"
                        }
                    },
                    {
                        $lookup: {
                            from: "connection_type",
                            localField: "connection_type.connection",
                            foreignField: "_id",
                            as: "connection_type"
                        }
                    },
            ]);
                console.log("result", result)

            return helpers.showResponse(true, Messages.USER_DATA_FOUND, result, {next:false}, 200);

        }
  



        


        // console.log("result", result);
        // return false;
       
       
       
       
       
        // let homeConnectionArray = [];
        // for (var i = 0; i < result.length; i++) {
        //     if (!rejectedConnectedUsers.includes(result[i]._id.toHexString())) {
        //         homeConnectionArray.push({...result[i], distance: null });
        //     }
        // }
        //if homeconnectionarray is empty and page no < total page number;
        // if (homeConnectionArray.length == 0) {
        //     if (total_page > page) {
        //         page = parseInt(page) + 1;
        //         let hom_conn = await connectionUtil.getNextHomeUsers(queryObject, page, rejectedConnectedUsers);
        //         if (hom_conn.status) {
        //             homeConnectionArray = hom_conn.data;
        //         }
        //     }
        // }
        //  console.log("homeConnectionArray", homeConnectionArray);
        // if (user_lat != "" && user_lng != "") {
        //     for (var d = 0; d < homeConnectionArray.length; d++) {
        //         if (homeConnectionArray[d].lat != "" && homeConnectionArray[d].lng != "") {
        //             let distance = await connectionUtil.getDistance(user_lat, user_lng, homeConnectionArray[d].lat, homeConnectionArray[d].lng);
        //             console.log(distance);
        //             homeConnectionArray[d].distance = distance.toFixed(0);
        //             // var temp = {...homeConnectionArray[d],distance:distance.toFixed(0)}
        //             // tempArray.push(temp);
        //         } else {
        //             homeConnectionArray[d].distance = null;
        //             // var temp = {...homeConnectionArray[d],distance:null}
        //             // tempArray.push(temp);
        //         }

        //     }
        // }
  
            // console.log("homeConnectionArray", homeConnectionArray);
            // if (homeConnectionArray.length > 0) {
            //     let next_page_user = await Users.aggregate(
            //         [{
            //                 $match: queryObject
            //             },
            //             { '$sort': { 'created_at': -1 } },
            //             {
            //                 $skip: (parseInt(page)) * 10
            //             },
            //             {
            //                 $limit: 10
            //             },
            //             {
            //                 $lookup: {
            //                     from: "gallery",
            //                     let: { user_id: "$_id" },
            //                     pipeline: [
            //                         { $match: { $and: [{ $expr: { $eq: ["$user_id", "$$user_id"] } }, { status: { $ne: 2 } }] } },
            //                         { $project: { _id: 1, is_profile: 1, media: 1, media_type: 1, thumbnail: 1 } }
            //                     ],
            //                     as: "gallery"
            //                 },
            //             },
            //             {
            //                 $lookup: {
            //                     from: "interests",
            //                     localField: "my_interests.interest",
            //                     foreignField: "_id",
            //                     as: "my_interests"
            //                 }
            //             },
            //         ]);
            //     let nextPageUserArray = [];
            //     for (var i = 0; i < next_page_user.length; i++) {
            //         if (!rejectedConnectedUsers.includes(next_page_user[i]._id.toHexString())) {
            //             nextPageUserArray.push(next_page_user[i]);
            //         }
            //     }
            //     if (nextPageUserArray.length > 0) {
            //         others.next_page = true;
            //     }
            // }
        return helpers.showResponse(true, Messages.USER_DATA_FOUND, [], {next:false}, 200);
    },

    getDistance: async(user_lat, user_lng, lat, lng) => {
        var p = 0.017453292519943295; // Math.PI / 180
        var c = Math.cos;
        var a = 0.5 - c((lat - user_lat) * p) / 2 + c(user_lat * p) * c(lat * p) * (1 - c((lng - user_lng) * p)) / 2;
        let distance = 12742 * Math.asin(Math.sqrt(a))
        return distance;
    },

    //swipe left
    leftSwipe: async(data) => {
        let { user_id, rejected_to } = data;
        let newObj = {
            rejected_by: user_id,
            rejected_to: rejected_to,
            created_at: moment().unix()
        };
        let dataRef = new leftSwipe(newObj)
        let result = await postData(dataRef);
        if (result.status) {
            return helpers.showResponse(true, Messages.REJECTED_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.REJECTED_FAILURE, null, null, 200);
    },

    //swipe right
    rightSwipe: async(data) => {
        let { user_id, requested_to } = data;
        //check if request already exist from request_to user
        let request_exist = await getSingleData(Connections, { requested_by: ObjectId(requested_to), requested_to: ObjectId(user_id), status: 'pending' }, '')
        if (request_exist.status) {
            //update the 1st request from pending to connected
            let updateObj = {
                status: 'connected',
                updated_at: moment().unix()
            };
            let update = await updateByQuery(Connections, updateObj, { requested_by: ObjectId(requested_to), requested_to: ObjectId(user_id) })
            if (update.status) {
                //send notification 
                // let populate = [{
                //     path: 'requested_by',
                //     select: '_id fcm_token profile_pic username '
                // }, {
                //     path: 'requested_to',
                //     select: '_id username'
                // }, ]
                // let user_exist = await getSingleData(Connections, { requested_by: ObjectId(requested_to), requested_to: ObjectId(user_id) }, '', populate);
                // console.log("user_exist===>", user_exist);
                // if (user_exist.status) {
                //     let fcm_token = user_exist.data.requested_by.fcm_token;
                //     if (fcm_token != "") {
                //         let userfcm_token = [fcm_token]

                //         let notifData = {
                //             title: "Its a Match",
                //             body: "You and " + user_exist.data.requested_to.username + " are connected now",
                //             // data: JSON.stringify({ 'type': "connection" ,})
                //             data: JSON.stringify({
                //                 type: "connection",
                //                 profile: user_exist.data.requested_by.profile_pic,
                //                 name: user_exist.data.requested_by.username,
                //                 user_id: user_exist.data.requested_by._id
                //             }),
                //         }
                //         let notifResp = await helpers.sendFcmNotification(userfcm_token, notifData);
                //     }
                // }
                return helpers.showResponse(true, Messages.CONNECTED_SUCCESS, updateObj, null, 200);
            }
            return helpers.showResponse(true, Messages.CONNECTED_FAILURE, null, null, 200);
        } else {
            //check if request already sent
            let result = await getSingleData(Connections, { requested_by: ObjectId(user_id), requested_to: ObjectId(requested_to) }, '')
            if (result.status) {
                return helpers.showResponse(false, Messages.REQUEST_SENT_FAILURE, null, null, 200);
            } else {
                let newObj = {
                    requested_by: user_id,
                    requested_to: requested_to,
                    status: 'pending',
                    created_at: moment().unix()
                };
                let dataRef = new Connections(newObj)
                let save = await postData(dataRef);
                if (save.status) {
                    //send notification to requested user and save notification 
                    // let notification_data = {
                    //     notification_by   : user_id,
                    //     notification_to   : requested_to,
                    //     notification_type : 'requested'
                    // }
                    // connectionUtil.sendNotification(notification_data) 

                    return helpers.showResponse(true, Messages.REQUEST_SENT_SUCCESS, save.data, null, 200);
                }
                return helpers.showResponse(true, Messages.REQUEST_SENT_FAILURE, save.data, null, 200);
            }
        }
    },

    //swipe up
    swipeUp: async(data) => {
        let { user_id, requested_to } = data;
        //check if request already exist from request_to user
        let query = {
            requested_by: ObjectId(requested_to),
            requested_to: ObjectId(user_id),
            $or: [{ status: 'pending' }, { status: 'super_liked' }]
        }

        let request_exist = await getSingleData(Connections, query, '')
        if (request_exist.status) {
            //update the 1st request from pending to connected
            let updateObj = {
                status: 'connected',
                updated_at: moment().unix()
            };
            let update = await updateByQuery(Connections, updateObj, { requested_by: ObjectId(requested_to), requested_to: ObjectId(user_id) })
            if (update.status) {
                return helpers.showResponse(true, Messages.CONNECTED_SUCCESS, save.data, null, 200);
            }
            return helpers.showResponse(true, Messages.CONNECTED_FAILURE, save.data, null, 200);
        } else {
            //check if request already sent
            let result = await getSingleData(Connections, { requested_by: ObjectId(user_id), requested_to: ObjectId(requested_to) }, '')
            if (result.status) {
                return helpers.showResponse(false, Messages.REQUEST_ALREADY_SENT, null, null, 200);
            } else {
                let newObj = {
                    requested_by: user_id,
                    requested_to: requested_to,
                    status: 'super_liked',
                    created_at: moment().unix()
                };
                let dataRef = new Connections(newObj)
                let save = await postData(dataRef);
                if (save.status) {
                    //send notification to requested user and save notification        
                    return helpers.showResponse(true, Messages.SUPER_LIKED_SUCCESS, save.data, null, 200);
                }
                return helpers.showResponse(true, Messages.SUPER_LIKED_FAILURE, save.data, null, 200);
            }
        }
    },

    //get my requests
    getReceivedRequests: async(data) => {
        let { user_id } = data;
        let populate = [{
            path: 'requested_by',
            select: '_id username email gender profile_pic location'
        }]
        let queryObject = {
            requested_to: ObjectId(user_id),
            status: 'pending',
        }
        console.log(queryObject);

        let result = await getDataArray(Connections, queryObject, ' ', null, { created_at: -1 }, populate)
        console.log(result);

        return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.status ? result.data : [], null, 200);

    },

    //get sent requests
    getSentRequests: async(data) => {
        let { user_id } = data;
        let populate = [{
            path: 'requested_to',
            select: '_id username email gender profile_pic location'
        }]
        let queryObject = {
            requested_by: ObjectId(user_id),
            $or: [{ status: 'pending' }, { status: 'super_liked' }]
        }
        let result = await getDataArray(Connections, queryObject, ' ', null, { created_at: -1 }, populate)
            // if(result.status){
        return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.status ? result.data : [], null, 200);
        // }
        // return helpers.showResponse(true, Messages.DATA_NOT_FOUND, null, null, 200);
    },

    //get my matches
    getMyMatches: async(data) => {
        let { user_id } = data;
        let populate = [{
            path: 'requested_by',
            select: '-password'
        }, {
            path: 'requested_to',
            select: '-password'
        }]
        let queryObject = { $or: [{ requested_to: ObjectId(user_id), requested_by: ObjectId(user_id) }], status: 'connected' }
        let result = await getDataArray(Connections, queryObject, ' ', null, { updated_at: -1 }, populate)
        if (result.status) {
            return helpers.showResponse(false, Messages.DATA_FOUND_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

    //get discover
    getDiscoverData: async(data) => {
        console.log("discover_Data query ", data);
        let { user_id, page, interested_in, connection_type, profile_verification, background_check_verification, driving_license_verification, filter_lat, filter_lng, filter_distance, isGlobal, min_age, max_age } = data;

        let user_lat = '';
        let user_lng = '';

        //get user lat long 
        let user_detail = await getSingleData(Users, { _id: ObjectId(user_id) })
        if (user_detail.status) {
            user_lat = user_detail.data.lat;
            user_lng = user_detail.data.lng;
        }

        // get rejected users
        let rejectedArray = [];
        let rejectQuery = { rejected_by: ObjectId(user_id) }
        let rejected = await getDataArray(leftSwipe, rejectQuery, 'rejected_to');
        if (rejected.status) {
            rejected.data.forEach(element => {
                rejectedArray.push(element.rejected_to);
            });
        }

        // get connected users
        let connectedArray = [];
        let connectedQuery = { $or: [{ requested_by: ObjectId(user_id) }, { requested_to: ObjectId(user_id) }], status: { $ne: "rejected" } }
        let connected = await getDataArray(Connections, connectedQuery, '');
        if (connected.status) {
            connected.data.forEach(element => {
                if (element.requested_to.toHexString() == user_id && element.status == "connected") {
                    connectedArray.push(element.requested_by);
                } else {
                    connectedArray.push(element.requested_to);
                }
            });
        }

        // get blocked users users
        let blockedQuery = { blocked_by: ObjectId(user_id) }
        let blocked = await getDataArray(BlockUsers, blockedQuery, 'blocked_to');
        if (blocked.status) {
            blocked.data.forEach(element => {
                connectedArray.push(element.blocked_to);
            });
        }
        //merege rejected and connection
        let rejectedConnectedUsers = rejectedArray.concat(connectedArray)
        let queryObject = { _id: { $ne: ObjectId(user_id) }, status: { $eq: 1 }  };

        if(rejectedConnectedUsers.length>0){
            rejectedConnectedUsers.push(ObjectId(user_id))
            queryObject._id = {$nin:rejectedConnectedUsers}
            console.log("rejectedConnectedUsers", rejectedConnectedUsers)
       }
        let interestedArray = []
        if (interested_in && interested_in != "") {
            interestedInArray_ = interested_in.split(',');
            interestedInArray_.forEach(element => {
                interestedArray.push({ gender: ObjectId(element) })
            })
            queryObject.$or = interestedArray;
        }

        let connArray = []
        if (connection_type && connection_type != "") {
            let conenctionTypeArray = connection_type.split(',');
            conenctionTypeArray.forEach(element => {
                connArray.push({ connection_type: { $elemMatch: { connection: ObjectId(element) } } })
            });
            queryObject.$or = connArray;
        }

        if (interestedArray.length > 0 && connArray.length > 0) {
            queryObject.$and = [
                { $or: interestedArray },
                { $or: connArray }
            ]
        }

        if (min_age && max_age && min_age != "" && max_age != "") {
            queryObject.age = { $gte: parseInt(min_age), $lte: parseInt(max_age) }
        }
        if(profile_verification!=""   && profile_verification == 1){
            queryObject.profile_verification = parseInt(profile_verification)
        }
        if (background_check_verification != "" && background_check_verification == 1) {
            queryObject.background_check_verification = parseInt(background_check_verification)
        }
        if (driving_license_verification != "" && driving_license_verification == 1) {
            queryObject.driving_license_verification = parseInt(driving_license_verification)
        }

        //if lat long exist in filter
        if (filter_lat && filter_lng && filter_lat != "" && filter_lng != "") {
            user_lat = filter_lat;
            user_lng = filter_lng;
        }

    
        let max_distance = 4 * 1609.344
        if(filter_distance && filter_distance!="" ){
            max_distance = Number(filter_distance) * 1609.344
        }

                /***************WHEN USER HAS ITS LOCATION ENABLED****************************** */
        if(user_lat!="" && user_lng!=""){
           console.log("==========User has enabled location===============")
            let geoQueryObj = {
                "query":  queryObject ,
                "near": {
                    "type": "Point",
                    "coordinates": [Number(user_lng), Number(user_lat)]
                },
                "distanceField": "distance",
                "spherical": true,
                "maxDistance": Number(max_distance)
            }
            if(isGlobal){
                if(isGlobal==true || isGlobal=='true'){
                    geoQueryObj = {
                        "query":  queryObject ,
                        "near": {
                            "type": "Point",
                            "coordinates": [Number(user_lng), Number(user_lat)]
                        },
                        "distanceField": "distance",
                        "spherical": true,
                    }
                }
            
            }
            console.log(Number(user_lng), Number(user_lat));
            console.log("queryObject", queryObject);

            let result = await Users.aggregate(
            [{
                $geoNear: geoQueryObj
            },
                { '$sort': { 'created_at': -1 } },
                {
                    $skip: (parseInt(page) - 1) * 30
                }, {
                    $limit: 30
                },
                {
                    $lookup: {
                        from: "interested_in",
                        let: { gender: "$gender" },
                        pipeline: [
                            { $match: { $and: [{ $expr: { $eq: ["$_id", "$$gender"] } }, { status: { $ne: 2 } }] } },
                            { $project: { _id: 1, name: 1, parent_id: 1 } }
                        ],
                        as: "gender"
                    },
                },

            ]);

            let total_users = result;
            if(isGlobal && isGlobal==true || isGlobal=='true'){
                queryObject.lat = ''
                queryObject.lng = ''
                let disabled_location_users =  await Users.aggregate(
                    [   {
                            $match: queryObject
                        },
                        { '$sort': { 'created_at': -1 } },
                        {
                            $skip: (parseInt(page) - 1) * 30
                        }, {
                            $limit: 30
                        },
                        {
                            $lookup: {
                                from: "interested_in",
                                let: { gender: "$gender" },
                                pipeline: [
                                    { $match: { $and: [{ $expr: { $eq: ["$_id", "$$gender"] } }, { status: { $ne: 2 } }] } },
                                    { $project: { _id: 1, name: 1, parent_id: 1 } }
                                ],
                                as: "gender"
                            },
                        },
        
                ]);
    
                console.log("disabled_location_users==IN DISCOVER",disabled_location_users)
                total_users = total_users.concat(disabled_location_users);
                
            
            }
            let others = { next_page: false }
            if (total_users.length > 0) {
                let next_page_user = await Users.aggregate(
                    [{
                            $match: queryObject
                        },
                        { '$sort': { 'created_at': -1 } },
                        {
                            $skip: (parseInt(page)) * 10
                        }, {
                            $limit: 10
                        },
                        {
                            $lookup: {
                                from: "interested_in",
                                let: { gender: "$gender" },
                                pipeline: [
                                    { $match: { $and: [{ $expr: { $eq: ["$_id", "$$gender"] } }, { status: { $ne: 2 } }] } },
                                    { $project: { _id: 1, name: 1, parent_id: 1 } }
                                ],
                                as: "gender"
                            },
                        },
                    ]);
                if (next_page_user.length > 0) {
                    others.next_page = true;
                }
            }

            return helpers.showResponse(true, Messages.USER_DATA_FOUND, total_users, others, 200);
        }
        else{
            console.log("*****************USERS LOCATION IS DISBLED (Discover)***************")
            let result =  await Users.aggregate(
                [   {
                        $match: queryObject
                    },
                    { '$sort': { 'created_at': -1 } },
                    {
                        $skip: (parseInt(page) - 1) * 30
                    }, {
                        $limit: 30
                    },
                    {
                        $lookup: {
                            from: "interested_in",
                            let: { gender: "$gender" },
                            pipeline: [
                                { $match: { $and: [{ $expr: { $eq: ["$_id", "$$gender"] } }, { status: { $ne: 2 } }] } },
                                { $project: { _id: 1, name: 1, parent_id: 1 } }
                            ],
                            as: "gender"
                        },
                    },
    
            ]);

            let others = { next_page: false }
            if (result.length > 0) {
                let next_page_user = await Users.aggregate(
                    [{
                            $match: queryObject
                        },
                        { '$sort': { 'created_at': -1 } },
                        {
                            $skip: (parseInt(page)) * 10
                        }, {
                            $limit: 10
                        },
                        {
                            $lookup: {
                                from: "interested_in",
                                let: { gender: "$gender" },
                                pipeline: [
                                    { $match: { $and: [{ $expr: { $eq: ["$_id", "$$gender"] } }, { status: { $ne: 2 } }] } },
                                    { $project: { _id: 1, name: 1, parent_id: 1 } }
                                ],
                                as: "gender"
                            },
                        },
                    ]);
                if (next_page_user.length > 0) {
                    others.next_page = true;
                }
            }

            return helpers.showResponse(true, Messages.USER_DATA_FOUND, result, others, 200);

        }
       
        let homeConnectionArray = [];
        // for (var i = 0; i < result.length; i++) {
        //     if (!rejectedConnectedUsers.includes(result[i]._id.toHexString())) {
        //         homeConnectionArray.push(result[i]);
        //     }
        // }
        // if (user_lat != "" && user_lng != "") {
        //     for (var d = 0; d < homeConnectionArray.length; d++) {
        //         if (homeConnectionArray[d].lat != "" && homeConnectionArray[d].lng != "") {
        //             let distance = await connectionUtil.getDistance(user_lat, user_lng, homeConnectionArray[d].lat, homeConnectionArray[d].lng);
        //             console.log(distance);
        //             homeConnectionArray[d].distance = distance.toFixed(0);
        //             // var temp = {...homeConnectionArray[d],distance:distance.toFixed(0)}
        //             // tempArray.push(temp);
        //         } else {
        //             homeConnectionArray[d].distance = null;
        //             // var temp = {...homeConnectionArray[d],distance:null}
        //             // tempArray.push(temp);
        //         }

        //     }
        // }

        let others = { next_page: false }
        if (result.length > 0) {
            let next_page_user = await Users.aggregate(
                [{
                        $match: queryObject
                    },
                    { '$sort': { 'created_at': -1 } },
                    {
                        $skip: (parseInt(page)) * 10
                    }, {
                        $limit: 10
                    },
                    {
                        $lookup: {
                            from: "interested_in",
                            let: { gender: "$gender" },
                            pipeline: [
                                { $match: { $and: [{ $expr: { $eq: ["$_id", "$$gender"] } }, { status: { $ne: 2 } }] } },
                                { $project: { _id: 1, name: 1, parent_id: 1 } }
                            ],
                            as: "gender"
                        },
                    },
                ]);
            // let nextPageUserArray = [];
            // for (var i = 0; i < next_page_user.length; i++) {
            //     if (!rejectedConnectedUsers.includes(next_page_user[i]._id.toHexString())) {
            //         nextPageUserArray.push(next_page_user[i]);
            //     }
            // }
            if (next_page_user.length > 0) {
                others.next_page = true;
            }
        }
      //  console.log("discover data", homeConnectionArray);
        return helpers.showResponse(true, Messages.USER_DATA_FOUND, result, others, 200);
    },

    //get Particular User Detail
    getParticularUserDetail: async(data) => {
        let { user_id, particular_user_id } = data;

        let queryObject = { _id: ObjectId(particular_user_id), status: { $ne: 2 } };
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
                select: 'name status'
            }
        ]
        console.log(queryObject);
        let result = await getSingleData(Users, queryObject, '-password', populate);
        console.log(result);
        if (result.status) {
            //get gallery data 
            let galleryData = await getDataArray(Gallery, { user_id: ObjectId(particular_user_id), status: { $eq: 1 } })
            let temp = {...result.data._doc, gallery: galleryData.status ? galleryData.data : [] }

            //check if user is alredy rejected
            let left_swiped = await getSingleData(leftSwipe, { rejected_by: ObjectId(user_id), rejected_to: ObjectId(particular_user_id) }, '')
            if (left_swiped.status) {
                temp = {...temp, is_swiped: 1 }
            } else {
                let right_swiped = await getSingleData(Connections, { requested_by: ObjectId(user_id), requested_to: ObjectId(particular_user_id) , status:"pending"}, '')
                if (right_swiped.status) {
                    temp = {...temp, is_swiped: 1 }
                } else {
                    let connection_swiped = await getSingleData(Connections, { $or:[{requested_by: ObjectId(user_id), requested_to: ObjectId(particular_user_id)}, {requested_to: ObjectId(user_id), requested_by: ObjectId(particular_user_id)}] , status:"connected"}, '')
                    if(connection_swiped.status){
                         temp = {...temp, is_swiped: 1 }
                    }else{
                        temp = {...temp, is_swiped: 0 }
                    }
                   
                }
            }
            //check if user is  blocked
            let user_blocked = await getSingleData(BlockUsers, { blocked_by: ObjectId(user_id), blocked_to: ObjectId(particular_user_id) }, '')
            if (user_blocked.status) {
                temp = {...temp, is_blocked: 1 }
            } else {
                temp = {...temp, is_blocked: 0 }
            }
            //check if I am blocked
            let i_blocked = await getSingleData(BlockUsers, { blocked_by: ObjectId(particular_user_id), blocked_to: ObjectId(user_id) }, '')
            if (i_blocked.status) {
                temp = {...temp, am_blocked: 1 }
            } else {
                temp = {...temp, am_blocked: 0 }
            }
            return helpers.showResponse(true, Messages.USER_DATA_FOUND, temp, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

    //Search by user name
    serchByUsername: async(data) => {
        let { user_id, username ,interested_in, connection_type, profile_verification, background_check_verification, driving_license_verification, 
            filter_lat, filter_lng, filter_distance, min_age, max_age } = data;
        // get rejected users
        let rejectedArray = [];
        let rejectQuery = { rejected_by: ObjectId(user_id) }
        let rejected = await getDataArray(leftSwipe, rejectQuery, 'rejected_to');
        if (rejected.status) {
            rejected.data.forEach(element => {
                rejectedArray.push(element.rejected_to.toHexString());
            });
        }

        // get connected users
        let connectedArray = [];
        let connectedQuery = { requested_by: ObjectId(user_id) }
        let connected = await getDataArray(Connections, connectedQuery, 'requested_to');
        if (connected.status) {
            connected.data.forEach(element => {
                connectedArray.push(element.requested_to.toHexString());
            });
        }

        // get blocked users users
        let blockedQuery = { blocked_by: ObjectId(user_id) }
        let blocked = await getDataArray(BlockUsers, blockedQuery, 'blocked_to');
        if (blocked.status) {
            blocked.data.forEach(element => {
                connectedArray.push(element.blocked_to.toHexString());
            });
        }
        //merege rejected and connection
        let rejectedConnectedUsers = rejectedArray.concat(connectedArray)

        // let queryObject = { _id: { $ne: ObjectId(user_id) }, username: { $regex: username, $options: 'i' } };
        let queryObject = { _id: { $ne: ObjectId(user_id) }, username: {$regex: '^' + username, $options: 'i'} };

        let interestedArray = []
        if (interested_in && interested_in != "") {
            interestedInArray = interested_in.split(',');
            interestedInArray.forEach(element => {
                interestedArray.push({ gender: ObjectId(element) })
            })
            queryObject.$or = interestedArray;
        }

        let connArray = []
        if (connection_type && connection_type != "") {
            conenctionTypeArray = connection_type.split(',');
            conenctionTypeArray.forEach(element => {
                connArray.push({ connection_type: { $elemMatch: { connection: ObjectId(element) } } })
            });
            queryObject.$or = connArray;
        }

        if (interestedArray.length > 0 && connArray.length > 0) {
            queryObject.$and = [
                { $or: interestedArray },
                { $or: connArray }
            ]
        }

        if (min_age != "" && max_age != "") {
            queryObject.age = { $gte: parseInt(min_age), $lte: parseInt(max_age) }
        }
        if(profile_verification!=""){
            queryObject.profile_verification = parseInt(profile_verification)
        }
        if (background_check_verification != "") {
            queryObject.background_check_verification = parseInt(background_check_verification)
        }
        if (driving_license_verification != "") {
            queryObject.driving_license_verification = parseInt(driving_license_verification)
        }

        let result = await Users.aggregate(
            [{
                    $match: queryObject
                },
                { '$sort': { 'created_at': -1 } },
                {
                    $lookup: {
                        from: "interested_in",
                        let: { gender: "$gender" },
                        pipeline: [
                            { $match: { $and: [{ $expr: { $eq: ["$_id", "$$gender"] } }, { status: { $ne: 2 } }] } },
                            { $project: { _id: 1, name: 1, parent_id: 1 } }
                        ],
                        as: "gender"
                    },
                },
        ]);

        
        let homeConnectionArray = [];
        for (var i = 0; i < result.length; i++) {
            if (!rejectedConnectedUsers.includes(result[i]._id.toHexString())) {
                homeConnectionArray.push(result[i]);
            }
        }
        return helpers.showResponse(true, Messages.USER_DATA_FOUND, homeConnectionArray, null, 200);
    },

    //get user by location 
    getUserByLocation: async(data) => {
        let { user_id, lat, lng, distance, interested_in, connection_type, profile_verification, background_check_verification, driving_license_verification, min_age, max_age } = data;

        let queryObject = { _id: { $ne: ObjectId(user_id) }, lat: { $ne: '' }, lng: { $ne: '' }, visible_on_map: { $ne: 0 }, status: { $eq: 1 } }

        // if (interested_in != "") {
        //     queryObject.gender = ObjectId(interested_in)
        // }
        // if (connection_type != "") {
        //     let connArray = []
        //     conenctionTypeArray = connection_type.split(',');
        //     conenctionTypeArray.forEach(element => {
        //         connArray.push({ connection_type: ObjectId(element) })
        //     });
        //     queryObject.$or = connArray;
        // }

        let interestedArray = []
        if (interested_in && interested_in != "") {
            interestedInArray = interested_in.split(',');
            interestedInArray.forEach(element => {
                interestedArray.push({ gender: ObjectId(element) })
            })
            queryObject.$or = interestedArray;
        }

        let connArray = []
        if (connection_type && connection_type != "") {
            conenctionTypeArray = connection_type.split(',');
            conenctionTypeArray.forEach(element => {
                connArray.push({ connection_type: { $elemMatch: { connection: ObjectId(element) } } })
            });
            queryObject.$or = connArray;
        }

        if (interestedArray.length > 0 && connArray.length > 0) {
            queryObject.$and = [
                { $or: interestedArray },
                { $or: connArray }
            ]
        }

        if (min_age != "" && max_age != "") {
            queryObject.age = { $gte: parseInt(min_age), $lte: parseInt(max_age) }
        }
        if (profile_verification != "") {
            queryObject.profile_verification = parseInt(profile_verification)
        }
        if (background_check_verification != "") {
            queryObject.background_check_verification = parseInt(background_check_verification)
        }
        if (driving_license_verification != "") {
            queryObject.driving_license_verification = parseInt(driving_license_verification)
        }
        let result = await getDataArray(Users, queryObject, '_id username lat lng profile_pic');
        if (result.status) {
            let homeConnectionArray = result.data
                // get blocked users users
            let blockedConnectedUsers = []
            let blockedQuery = { blocked_by: ObjectId(user_id) }
            let blocked = await getDataArray(BlockUsers, blockedQuery, 'blocked_to');
            if (blocked.status) {
                blocked.data.forEach(element => {
                    blockedConnectedUsers.push(element.blocked_to.toHexString());
                });
            }

            if (blockedConnectedUsers.length > 0) {
                homeConnectionArray = [];
                for (var i = 0; i < result.data.length; i++) {
                    if (!blockedConnectedUsers.includes(result.data[i]._id.toHexString())) {
                        homeConnectionArray.push(result.data[i]);
                    }
                }
            }


            // for(var i=0;i<result.data.length;i++){
            //     if(!rejectedConnectedUsers.includes(result.data[i]._id.toHexString())){  
            //         homeConnectionArray.push(result.data[i]);
            //     }
            // }
            // let fiteredUserArray = [];
            //get users with provided lat long and distance
            // for(var j=0 ; j<homeConnectionArray.length;j++){
            //     let user_distance = await connectionUtil.getDistance(lat, lng, homeConnectionArray[j].lat, homeConnectionArray[j].lng);
            //     // if(user_distance > distance){
            //         user_distance = user_distance.toFixed(1);
            //         let temp = { ...homeConnectionArray[j]._doc, distance: parseInt(user_distance) }
            //     //    console.log(temp);
            //         fiteredUserArray.push(temp);
            //     // }
            // } 
            console.log("map screen user", homeConnectionArray);
            return helpers.showResponse(true, Messages.USER_DATA_FOUND, homeConnectionArray, null, 200);
        }
        return helpers.showResponse(true, Messages.DATA_NOT_FOUND, [], null, 200);
    },

    //undo left swipe
    undoLeftSwipe: async(data) => {
        let { user_id } = data;
        let result = await getDataArray(leftSwipe, { rejected_by: ObjectId(user_id) }, '', null, { created_at: -1 })
        if (result.status) {
            let deleteD = await deleteData(leftSwipe, { _id: ObjectId(result.data[0]._id) });
            if (deleteD.status) {
                return helpers.showResponse(true, Messages.UNDO_SUCCESS, null, null, 200);
            }
            return helpers.showResponse(false, Messages.UNDO_FAILURE, null, null, 200);
        }
        return helpers.showResponse(false, Messages.NOTHING_TO_UNDO, null, null, 200);
    },

    //get my connection list
    getMyConnectionList: async(data) => {
        let { user_id } = data;
        let populate = [{
                path: 'requested_to',
                select: '_id username email gender profile_pic location'
            },
            {
                path: 'requested_by',
                select: '_id username email gender profile_pic location'
            }
        ]

        //get reproted user list
        let reportedUsers = []
        let reportQuery = { blocked_by: ObjectId(user_id) , type:"report" }
        let reported = await getDataArray(BlockUsers, reportQuery, 'blocked_to');
        if (reported.status) {
            reported.data.forEach(element => {
                reportedUsers.push(element.blocked_to.toHexString());
            });
        }

        console.log("reportedUsers", reportedUsers)

        // let queryObj = { status: 'connected',  $or: [{ requested_by: ObjectId(user_id) }, { requested_to: ObjectId(user_id) }] }
        let queryObj = { status: 'connected',  
            $and:[
                {$or:[{ requested_by: ObjectId(user_id) }, { requested_to: ObjectId(user_id) }] },
                {$and:[{ requested_by: {$nin:reportedUsers} }, { requested_to: {$nin:reportedUsers}}] }
            ]}

        // { status: 'connected',  
        //     $and:[
        //         {$or:[{ requested_by: ObjectId('62fbf2865c0283aaa5500c60') }, { requested_to: ObjectId('62fbf2865c0283aaa5500c60') }] },
        //         {$or:[{ requested_by: {$nin:[ObjectId('62fbf2865c0283aaa5500c60')]} }, { requested_to: {$nin:[ObjectId('62fbf2865c0283aaa5500c60')]}}] }
        // ]}
        
        // $or: [{ requested_by: ObjectId(user_id) }, { requested_to: ObjectId(user_id) }] }
        let result = await getDataArray(Connections, queryObj, '', null, { updated_at: -1 }, populate)
        if (result.status) {
            return helpers.showResponse(true, Messages.CONNECTIONS_FOUND_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(true, Messages.CONNECTIONS_FOUND_FAILURE, [], null, 200);
    },

    //delete connection
    deleteConnection: async(data) => {
        let { user_id, connection_user_id } = data;
        let queryObj = { $or: [{ requested_by: ObjectId(connection_user_id) }, { requested_to: ObjectId(connection_user_id) }] }
        let res = await deleteData(Connections, queryObj)
        if (res.status) {
            return helpers.showResponse(true, Messages.CONNECTION_REMOVED_SUCCESS, res.data, null, 200);
        }
        return helpers.showResponse(false, Messages.CONNECTION_REMOVED_FAILURE, null, null, 200);
    },

    deleteMultipleConnection: async(data) => {
        let { user_id, connection_user_ids } = data;
        let connectionIds = connection_user_ids.split(',');
        console.log(connectionIds);
        let queryObj = { $or: [{ requested_by: { $in: connectionIds } }, { requested_to: { $in: connectionIds } }] }
        console.log("==", queryObj)
        let res = await deleteData(Connections, queryObj)
        if (res.status) {
            return helpers.showResponse(true, Messages.CONNECTION_REMOVED_SUCCESS, res.data, null, 200);
        }
        return helpers.showResponse(false, Messages.CONNECTION_REMOVED_FAILURE, null, null, 200);
    },

    //delete connection
    deleteSentRequest: async(data) => {
        let { user_id, connection_user_id } = data;
        let queryObj = { requested_by: ObjectId(user_id), requested_to: ObjectId(connection_user_id) }
        let res = await deleteData(Connections, queryObj)
        if (res.status) {
            return helpers.showResponse(true, Messages.REQUEST_REVOKED_SUCCESS, res.data, null, 200);
        }
        return helpers.showResponse(false, Messages.REQUEST_REVOKED_FAILURE, null, null, 200);
    },
    
    deleteMultipleSentConnection: async(data) => {
        let { user_id, connection_user_ids } = data;
        let connectionIds = connection_user_ids.split(',');
        let queryObj = { requested_by: ObjectId(user_id), requested_to: { $in: connectionIds } }

        let res = await deleteData(Connections, queryObj)
        if (res.status) {
            return helpers.showResponse(true, Messages.REQUEST_REVOKED_SUCCESS, res.data, null, 200);
        }
        return helpers.showResponse(false, Messages.REQUEST_REVOKED_FAILURE, null, null, 200);
    },


    //Reject Received
    rejectReceivedRequest: async(data) => {
        let { user_id, delete_user_id } = data;
        //get user detail
        let populate = [{
            path: 'requested_to',
            select: '_id username '
        }, {
            path: 'requested_by',
            select: '_id  fcm_token'
        }]

        let queryObject = { requested_to: ObjectId(user_id), requested_by: ObjectId(delete_user_id), status: "pending" };
        let result = await getSingleData(Connections, queryObject, '', populate);
        console.log("result user", result);
        if (result.status) {
            let fcm_token = result.data.requested_by.fcm_token;

            let updateObj = {
                status: "rejected",
                updated_at: moment().unix()
            }
            let update = await updateByQuery(Connections, updateObj, queryObject)
            console.log("update", update);
            if (update.status) {
                if (fcm_token != "") {
                    let userfcm_token = [fcm_token]
                    let notifData = {
                        title: "Request Rejected",
                        body: result.data.requested_by.username + " rejected your connection request",
                        data: { "type": "" }
                    }
                    let notifResp = await helpers.sendNewCurlNotification(userfcm_token, notifData);
                }
                return helpers.showResponse(true, Messages.DELETED_SUCCESS, null, null, 200);
            }
            return helpers.showResponse(false, Messages.DELETED_FAILURE, [], null, 200);
        }
        return helpers.showResponse(false, Messages.DELETED_FAILURE, [], null, 200);
    },

    //send notification 
    sendNotification: async(data) => {
        let { notification_to, notification_by, notification_type } = data;

        //get detail of user to whome have to send notification
        let queryObject = { _id: ObjectId(notification_to), status: { $eq: 1 } }
        let result = await getSingleData(Users, queryObject, '');
        if (result.status) {
            let fcm_token = result.data.fcm_token;
            let notification_status = result.data.notification_status;
            if (notification_status && fcm_token != "") {
                let userfcm_token = [fcm_token]
                let notifData = {
                    title: "Connection Request",
                    body: "You have got a new connection request",
                    data: notification_by
                }
                let notifResp = await helpers.sendFcmNotification(userfcm_token, notifData);
                return helpers.showResponse(true, "Notification Success", null, null, 200);
            }
            return helpers.showResponse(true, "Notification Success", null, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },

}
module.exports = {...connectionUtil }