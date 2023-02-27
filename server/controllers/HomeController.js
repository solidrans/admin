var Connections = require('../utils/Connections')
const upload = require('../services/image-upload')
const singleUpload = upload.single('user_profile')
const Messages = require('../utils/Users/message')
let helpers = require('../services/helper')
let moment = require('moment')
let ObjectId = require('mongodb').ObjectId
const path = require('path');

const homeController = {
    getHomeConnections: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }

        req.query.user_id = _id;
        let result = await Connections.getHomeConnections(req.query);
        return helpers.showOutput(res, result, result.code);
    },
    getDiscoverData: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        req.body.user_id = _id;
        let requiredFields = ['page'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Connections.getDiscoverData(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    leftSwipe: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['rejected_to'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = _id;
        let result = await Connections.leftSwipe(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    rightSwipe: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['requested_to'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = _id;

        let result = await Connections.rightSwipe(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    swipeUp: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['requested_to'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = _id;

        let result = await Connections.swipeUp(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    getReceivedRequests: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        req.body.user_id = _id;
        let result = await Connections.getReceivedRequests(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    getSentRequests: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        req.body.user_id = _id;
        let result = await Connections.getSentRequests(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    getMyMatches: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        req.body.user_id = _id;
        let result = await Connections.getMyMatches(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    otherUserDetails: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = user_id;
        req.body.particular_user_id = req.body._id;
        let result = await Connections.getParticularUserDetail(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    serchByUsername: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['username'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = _id;
        let result = await Connections.serchByUsername(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    getUserByLocation: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['lat', 'lng', 'distance'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = _id;
        let result = await Connections.getUserByLocation(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    undoLeftSwipe: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        req.body.user_id = _id;
        let result = await Connections.undoLeftSwipe(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    getMyConnectionList: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        req.body.user_id = _id;
        let result = await Connections.getMyConnectionList(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    deleteConnection: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['connection_user_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = _id;
        let result = await Connections.deleteConnection(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    deleteMultipleConnection: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['connection_user_ids'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = _id;
        let result = await Connections.deleteMultipleConnection(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    deleteSentRequest: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['connection_user_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = _id;
        let result = await Connections.deleteSentRequest(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    deleteMultipleSentConnection: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['connection_user_ids'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = _id;
        let result = await Connections.deleteMultipleSentConnection(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    rejectReceivedRequest: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['delete_user_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = _id;
        let result = await Connections.rejectReceivedRequest(req.body);
        return helpers.showOutput(res, result, result.code);
    },

}
module.exports = {...homeController }