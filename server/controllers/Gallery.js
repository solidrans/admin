var Messages = require("../utils/Gallery/message");
var Gallery = require('../utils/Gallery');
var helpers = require('../services/helper')
const upload = require('../services/image-upload')
const singleUpload = upload.single('gallery_media')

const galleryController = {
    getGallery: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let result = await Gallery.getGallery(_id);
        return helpers.showOutput(res, result, result.code);
    },

    addGalleryImage: async(req, res) => {
        singleUpload(req, res, async(err) => {
            let _id = req.decoded.user_id;
            if (!_id) {
                return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
            }
            let user_id = _id;
            if (!req.file) {
                return helpers.showOutput(res, helpers.showResponse(false, Messages.MEDIA_NOT_SELECTED), 403);
            }
            let { filename } = req.file;
            req.body.media = "user_gallery/" + filename;

            let result = await Gallery.addGalleryImage(req.body, user_id);
            return helpers.showOutput(res, result, result.code);
        })
    },

    removeFromGallery: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['gallery_id', 'is_profile'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = _id;
        let result = await Gallery.removeFromGallery(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    setAsProfile: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['gallery_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = _id;
        let result = await Gallery.setAsProfile(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    getVideoThumb: async(req, res) => {
        let requiredFields = ['file_url'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Gallery.getVideoThumb(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateGalleryOrder: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['gallery_ids'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = _id;
        let result = await Gallery.updateGalleryOrder(req.body);
        return helpers.showOutput(res, result, result.code);
    }
}

module.exports = {
    ...galleryController
}