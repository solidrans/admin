var Messages = require("../utils/InterestedIn/message");
var InterestedIn = require('../utils/InterestedIn');
var helpers = require('../services/helper')
const upload_s3 = require('../services/image-upload-s3')
const singleUpload = upload_s3.single('interested_in_icon')
const connectionImageUpload = upload_s3.single('connection_images')
const sharpFile = require('../services/image_conversion')

const interestedInController = {
    //=====================USER APIS=========================
    getAllConnectionTypes: async(req, res) => {
        let result = await InterestedIn.getAllConnectionTypes();
        return helpers.showOutput(res, result, result.code);
    },
    getAllInterestedIn: async(req, res) => {
        let result = await InterestedIn.getAllInterestedIn();
        return helpers.showOutput(res, result, result.code);
    },
    getAllInterests: async(req, res) => {
        let requiredFields = ['connection_type_id']; // get multiple connection ids here
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await InterestedIn.getAllInterests(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    //=====================ADMIn APIS======================
    //interested in
    getAllInterestedInAdmin: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.INVALID_ADMIN), 403);
        }
        let result = await InterestedIn.getAllInterestedInAdmin();
        return helpers.showOutput(res, result, result.code);
    },

    getInterestedInSubcategory: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.INVALID_ADMIN), 403);
        }
        let requiredFields = ['_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await InterestedIn.getInterestedInSubcategory(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    addInterestedIn: async(req, res) => {
        singleUpload(req, res, async(err) => {
            let admin_id = req.decoded.admin_id;
            if (!admin_id) {
                return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
            }

            if (!req.file) {
                return helpers.showOutput(res, helpers.showResponse(false, Messages.ICON_NOT_SELECTED), 403);
            }
            // let { filename } = req.file;

            let requiredFields = ['name'];
            let validator = helpers.validateParams(req, requiredFields);
            if (!validator.status) {
                return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
            }
            let converted_image = await sharpFile.convertImageToWebp(req.file);
            req.body.icon = converted_image.status?converted_image.data?.Key:"";
            let result = await InterestedIn.addInterestedIn(req.body);
            return helpers.showOutput(res, result, result.code);
        });
    },

    addInterestedInSubcategory: async(req, res) => {
        let requiredFields = ['_id', 'name'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }

        let result = await InterestedIn.addInterestedInSubcategory(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateInterestedInStatus: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['_id', 'status'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await InterestedIn.updateInterestedInStatus(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    getAllGenders: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }

        let result = await InterestedIn.getAllGenders();
        return helpers.showOutput(res, result, result.code);
    },

    updateInterestedIn: async(req, res) => {
        singleUpload(req, res, async(err) => {
            let admin_id = req.decoded.admin_id;
            if (!admin_id) {
                return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
            }
            let requiredFields = ['_id', 'name'];
            let validator = helpers.validateParams(req, requiredFields);
            if (!validator.status) {
                return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
            }
            if (req.file) {
                let converted_image = await sharpFile.convertImageToWebp(req.file);
                req.body.icon = converted_image.status?converted_image.data?.Key:"";
                // let { filename } = req.file;
                // req.body.icon = 'interested_in/' + filename;
            }

            let result = await InterestedIn.updateInterestedIn(req.body);
            return helpers.showOutput(res, result, result.code);
        });
    },

    //interests
    getAllInterestsAdmin: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['connection_type_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await InterestedIn.getAllInterestsAdmin(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    addInterest: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['connection_type_id', 'name'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await InterestedIn.addInterest(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateInterest: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['_id', 'name'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }

        let result = await InterestedIn.updateInterest(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateInterestStatus: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['_id', 'status'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }

        let result = await InterestedIn.updateInterestStatus(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    //connection type
    getAllConnectionTypesAdmin: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let result = await InterestedIn.getAllConnectionTypesAdmin();
        return helpers.showOutput(res, result, result.code);
    },

    addConnectionType: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        if (!req.files) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.MEDIA_NOT_SELECTED), 403);
        }
        let requiredFields = ['name'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }

        let imageArray = [];
        if (req.files) {
            console.log("request files", req.files);
            if (req.files.connection_images) {
                for (let i = 0; i < req.files.connection_images.length; i++) {
                    let converted_image = await sharpFile.convertImageToWebp(req.files.connection_images[i]);
                    if(converted_image.status){
                        let connectionData = {
                            name: converted_image.status?converted_image.data?.Key:"",
                        }
                        imageArray.push(connectionData);
                    }
                }
            }
        }
        req.body.images = imageArray;
        let result = await InterestedIn.addConnectionType(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    editConnectionType: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['connection_id', 'name'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await InterestedIn.editConnectionType(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    deleteConnectionImage: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['connection_id', 'image_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }

        let result = await InterestedIn.deleteConnectionImage(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    addConnectionImage: async(req, res) => {
        connectionImageUpload(req, res, async(err) => {
            let admin_id = req.decoded.admin_id;
            if (!admin_id) {
                return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
            }

            if (!req.file) {
                return helpers.showOutput(res, helpers.showResponse(false, Messages.IMAGE_NOT_SELECTED), 403);
            }
            // let { filename } = req.file;

            let requiredFields = ['connection_id'];
            let validator = helpers.validateParams(req, requiredFields);
            if (!validator.status) {
                return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
            }
            let converted_image = await sharpFile.convertImageToWebp(req.file);
            req.body.image = converted_image.status?converted_image.data?.Key:"";

            let result = await InterestedIn.addConnectionImage(req.body);
            return helpers.showOutput(res, result, result.code);
        });
    },

    editConnectionImage: async(req, res) => {
        connectionImageUpload(req, res, async(err) => {
            let admin_id = req.decoded.admin_id;
            if (!admin_id) {
                return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
            }

            if (!req.file) {
                return helpers.showOutput(res, helpers.showResponse(false, Messages.IMAGE_NOT_SELECTED), 403);
            }
            let { filename } = req.file;

            let requiredFields = ['connection_id', 'image_id'];
            let validator = helpers.validateParams(req, requiredFields);
            if (!validator.status) {
                return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
            }
            let converted_image = await sharpFile.convertImageToWebp(req.file);
            req.body.image = converted_image.status?converted_image.data?.Key:"";
            let result = await InterestedIn.editConnectionImage(req.body);
            return helpers.showOutput(res, result, result.code);
        });
    },

    getConenctionDetail: async(req, res) => {
        connectionImageUpload(req, res, async(err) => {
            let admin_id = req.decoded.admin_id;
            if (!admin_id) {
                return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
            }
            let requiredFields = ['connection_id'];
            let validator = helpers.validateParams(req, requiredFields);
            if (!validator.status) {
                return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
            }

            let result = await InterestedIn.addConnectionDetail(req.body);
            return helpers.showOutput(res, result, result.code);
        });
    },

    dragDropConnectionImages: async(req, res) => {
        let admin_id = req.decoded.admin_id;
        if (!admin_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['connection_id', 'connection_images'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await InterestedIn.dragDropConnectionImages(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateInterestSortOrder: async(req, res) => {

        let requiredFields = ['connection_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await InterestedIn.updateInterestSortOrder(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    deleteConnectionType: async(req, res) => {
        let requiredFields = ['connection_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await InterestedIn.deleteConnectionType(req.body);
        return helpers.showOutput(res, result, result.code);
    },

}
module.exports = {
    ...interestedInController
}