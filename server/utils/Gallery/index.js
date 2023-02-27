require('../../db_functions')
let Gallery = require('../../models/Gallery')
let ObjectId = require('mongodb').ObjectId
let Messages = require("./message");
let helpers = require('../../services/helper')
let moment = require('moment')
var Users = require('../Users');
let path = require('path');
let Thumbler = require('thumbler');
const { getVideoDurationInSeconds } = require('get-video-duration');

const galleryUtil = {
    //Gallery
    getGallery: async(user_id) => {
        let queryObject = { user_id: ObjectId(user_id), status: { $eq: 1 } }
        let sort = { sort_order: 1 }
        let result = await getDataArray(Gallery, queryObject, '', null, sort);
        // if (result.status) {
        return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.status ? result.data : [], null, 200);
        // }
        // return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },
    addGalleryImage: async(data) => {
        // let dataRef = new Gallery(data)
        // let result = await postData(dataRef);
        let result = await Gallery.insertMany(data);
        if (result) {
            return helpers.showResponse(true, Messages.MEDIA_UPLOADED_SUCCESS, data, null, 200);
        }
        return helpers.showResponse(false, Messages.MEDIA_UPLOADED_FAILURE, null, null, 200);
    },
    removeFromGallery: async(data) => {
        let { gallery_id, user_id, is_profile } = data;
        let galleryData = {
            status: 2,
            updated_at: moment().unix()
        }
        let response = await updateByQuery(Gallery, galleryData, { user_id: ObjectId(user_id), _id: ObjectId(gallery_id) });
        if (response.status) {
            let gallery = await galleryUtil.getGallery(user_id);
            //if image is profile pic
            if (is_profile == 1 && gallery.status) {
                for (var i = 0; i < gallery.data.length; i++) {
                    if (gallery.data[i].media_type === "image") {
                        //update as profile pic
                        let profile = await updateData(Gallery, { is_profile: 1 }, ObjectId(gallery.data[i]._id))
                        if (profile.status) {
                            let profileData = {
                                _id: user_id,
                                profile_pic: gallery.data[i].media,
                            }
                            let update_p = await Users.updateUserProfile(profileData)
                            if (update_p.status) {
                                let new_gallery = await galleryUtil.getGallery(user_id);
                                return helpers.showResponse(true, Messages.REMOVED_SUCCESSFULLY, new_gallery.status ? new_gallery.data : [], null, 200);
                            }
                            return helpers.showResponse(true, Messages.UNABLE_TO_UPDATE, null, null, 200);
                        }
                        return helpers.showResponse(true, Messages.UNABLE_TO_UPDATE, null, null, 200);
                    }
                }
            }
            return helpers.showResponse(true, Messages.REMOVED_SUCCESSFULLY, gallery.status ? gallery.data : [], null, 200);
        }
        return helpers.showResponse(false, Messages.REMOVED_FAILURE, null, null, 200);
    },
    setAsProfile: async(data) => {
        let { gallery_id, user_id } = data;
        //set is_profile as 0 for all the images
        let d = await updateByQuery(Gallery, { is_profile: 0 }, { user_id: ObjectId(user_id) })
        if (d.status) {
            //mark the selected image as profile(set is_profile 1)
            let update = await updateData(Gallery, { is_profile: 1 }, ObjectId(gallery_id))
            if (update.status) {
                //set new profile as profile_pic in user collection
                let profileData = {
                    _id: user_id,
                    profile_pic: update.data.media,
                }
                let update_p = await Users.updateUserProfile(profileData)
                if (update_p.status) {
                    let gallery = await galleryUtil.getGallery(user_id);
                    return helpers.showResponse(true, Messages.SET_AS_PROFILE_SUCCESS, gallery.status ? gallery.data : [], null, 200);
                }
                return helpers.showResponse(false, Messages.UNABLE_TO_UPDATE, null, null, 200);
            }
            return helpers.showResponse(true, Messages.SET_AS_PROFILE_FAILURE, null, null, 200);
        }
        return helpers.showResponse(false, Messages.UNABLE_TO_UPDATE, null, null, 200);
    },
    getVideoThumb: async(data) => {
        return new Promise(async(resolve, reject) => {
            try {
                let { file_url } = data;
                // get video duration 
                const duration = await getVideoDurationInSeconds(file_url)
                let actualimagepath = file_url
                let file_name = `${new Date().getTime()}.jpeg`;
                let localPath = path.join(__dirname, "/../../assets/user_chat/thumbs/" + file_name)
                let thumbnail_time = '00:00:01';
                // if(duration>="1000" && duration<="2000"){
                //     thumbnail_time = '00:00:01';
                // }
                Thumbler({
                    type: 'video',
                    input: actualimagepath,
                    output: localPath,
                    time: thumbnail_time,
                }, async function(err, resp) {
                    if (err) {
                        console.log("err", err)
                        return resolve(helpers.showResponse(false, "Thumb Error", null, null, 200));
                    }
                    console.log("resp", resp)
                    return resolve(helpers.showResponse(true, "Thumb found", { path: "user_chat/thumbs/" + file_name, duration: parseInt(duration) }, null, 200));
                })
            } catch (err) {
                console.log(err, " : err")
                resolve(helpers.showResponse(false, err.message, null, null, 200));
            }
        })
    },
    
    updateGalleryOrder: async(data) => {
        let { user_id, gallery_ids } = data;
        let galleryArray = gallery_ids.split(',');
        //check if 1st gallery media is video 
        let video = await getSingleData(Gallery, { _id: galleryArray[0], media_type: "video" }, '')
        if (video.status) {
            let gallery = await galleryUtil.getGallery(user_id);
            return helpers.showResponse(true, Messages.ORDER_UPDATE_SUCCESS, gallery.status ? gallery.data : [], null, 200);
        }

        let result = await getDataArray(Gallery, { user_id: ObjectId(user_id), status: { $ne: 2 } }, '')
        if (result.status) {
            for (var i = 0; i < result.data.length; i++) {
                for (var j = 0; j < galleryArray.length; j++) {
                    if (result.data[i]._id.toHexString() == galleryArray[j]) {
                        let update = await updateData(Gallery, { sort_order: (j + 1) }, ObjectId(result.data[i]._id))
                        break;
                    }
                }
            }
            let gallery = await galleryUtil.getGallery(user_id);

            return helpers.showResponse(true, Messages.ORDER_UPDATE_SUCCESS, gallery.status ? gallery.data : [], null, 200);
        }
        return helpers.showResponse(false, Messages.ORDER_UPDATE_FAILURE, null, null, 200);
    }
}
module.exports = {...galleryUtil }