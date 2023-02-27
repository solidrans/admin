var Users = require('../utils/Users')
var Gallery = require('../utils/Gallery')
let UsersModel = require('../models/Users')
const upload = require('../services/image-upload')
const singleUpload = upload.single('gallery_media')
const videoUpload = upload.single('video')
const Messages = require('../utils/Users/message')
let helpers = require('../services/helper')
let moment = require('moment')
let ObjectId = require('mongodb').ObjectId
const Thumbler = require('thumbler');
const path = require('path')
// const VerificationImages = require('../models/VerificationImages')
// const compress_images = require("compress-images")
const sharpFile = require('../services/image_conversion')


const userController = {
    phoneNumberExist: async(req, res) => {
        let requiredFields = ['phone_number'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
    
        let result = await Users.phoneNumberExist(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    register: async(req, res) => {
        let requiredFields = ['login_source'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        if (req.body.login_source === "phone") {
            let requiredFields = ['country_code', 'phone_number'];
            let validator = helpers.validateParams(req, requiredFields);
            if (!validator.status) {
                return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
            }
        } else if (req.body.login_source == "social") { //for facebook and gmail
            let requiredFields = ['email'];
            let validator = helpers.validateParams(req, requiredFields);
            if (!validator.status) {
                return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
            }
        } else if (req.body.login_source == "apple") {
            let requiredFields = ['auth_token'];
            let validator = helpers.validateParams(req, requiredFields);
            if (!validator.status) {
                return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
            }
        }
        let result = await Users.register(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    verifyOtp: async(req, res) => {
        let requiredFields = ['phone_number', 'otp'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Users.verifyOtp(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateUserProfile: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let userDataObj = {
            updated_at: moment().unix(),
            bio: req.body.bio,
            occupation: req.body.occupation,
            email: req.body.email?.toLowerCase(),
            phone_number: req.body.phone_number,
            is_phone_verified:1,
        };

        if (req.body.username && req.body.username != "") {
            userDataObj.username = req.body.username;
        }
        if (req.body.gender && req.body.gender != "") {
            userDataObj.gender = req.body.gender
        }
        if (req.body.fcm_token && req.body.fcm_token != "") {
            userDataObj.fcm_token = req.body.fcm_token
        }
        if (req.body.profile_pic && req.body.profile_pic != "") {
            userDataObj.profile_pic = req.body.profile_pic
        }
        if (req.body.dob && req.body.dob != "") {
            userDataObj.dob = req.body.dob;
            let date = moment(parseInt(req.body.dob) * 1000).format('YYYY-MM-DD');
            userDataObj.age = moment().diff(date, 'years');
        }
        let result = await Users.updateUserDetails(userDataObj, user_id);
        return helpers.showOutput(res, result, result.code);
    },

    updateUserInterestedIn: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['interested_in'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = user_id;
        let result = await Users.updateUserInterestedIn(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateUserConnectionType: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['connection_type'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = user_id;
        let result = await Users.updateUserConnectionType(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateUserInterests: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        // let requiredFields = ['interests'];
        // let validator = helpers.validateParams(req, requiredFields);
        // if (!validator.status) {
        //     return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        // }
        req.body.user_id = user_id;
        let result = await Users.updateUserInterests(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateUserLocation: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        req.body.user_id = user_id;
        let result = await Users.updateUserLocation(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    updateUserLocation: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        req.body.user_id = user_id;
        let result = await Users.updateUserLocation(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    enableLocation: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        req.body.user_id = user_id;
        let requiredFields = ['enable_location'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Users.enableLocation(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateUserFcm: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['notification_status'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = user_id;
        let result = await Users.updateUserFcm(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateVisibleOnMap: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['visible_on_map'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = user_id;
        let result = await Users.updateVisibleOnMap(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    addProfileGallery: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let user_id = _id;
     
        let user_d = await UsersModel.aggregate([
                {$match:{_id:ObjectId(user_id)}},
                {$lookup:{
                    from:"gallery",
                    localField:"_id",
                    foreignField:"user_id",
                    as:"gallery_data",
                    pipeline:[ {$project:{is_profile:1,sort_order:1 }},{$sort:{sort_order:-1}},{$limit:1}]
                }},
                {$project:{profile_pic:1,gallery_data:1 }}
        ])  
        let local_profile =  user_d[0]?.profile_pic;
        let last_sort_order = user_d[0]?.gallery_data?.length>0?user_d[0]?.gallery_data[0]?.sort_order:1
        if (req.files) {
            if (req.files.gallery_media) {
                let galleryArray = [];
                for (let i = 0; i < req.files.gallery_media.length; i++) {
                    last_sort_order = parseInt(last_sort_order) + 1;
                    let mime_type = req.files.gallery_media[i].mimetype.split("/");
                     mime_type = mime_type[0];
                    if (mime_type === "image") {
                        let converted_image = await sharpFile.convertImageToWebp(req.files.gallery_media[i]);
                        console.log("converted_image", converted_image);
                        if(converted_image.status){
                            let pData = {
                                user_id,
                                media: converted_image?.data?.Key,
                                media_type: mime_type,
                                is_profile: 0,
                                sort_order: last_sort_order,
                            }
                            if (local_profile == "") {
                                //set image as profile 
                                pData.is_profile = 1;
                                //update user profile 
                                let profileData = {
                                    _id: user_id,
                                    profile_pic: pData.media,
                                }
                                let profile = await Users.updateUserProfile(profileData);
                                if (!profile.status) {
                                    return helpers.showResponse(false, Messages.PROFILE_UPDATE_FAILURE, null, null, 200);
                                }
                                local_profile = pData.media;
                            }
                            galleryArray.push(pData);
                        }
                    } else if (mime_type === "video") {
                        console.log("inside video ");
                        let upload_video = await sharpFile.uploadVideoInBucket(req.files.gallery_media[i]);
                        console.log("upload_video", upload_video);
                        // let actualimagepath = `http://localhost:5068/files/user_gallery/${req.files.gallery_media[i].filename}`
                        // let d = await userController.getVideoThumb(actualimagepath);
                        // let thumbnail_path = d.data.path;
                        if(upload_video.status){
                            let pVideoDataObj = {
                                user_id,
                                media: upload_video?.data?.key,
                                thumbnail: upload_video?.data?.Key,
                                media_type: mime_type,
                                sort_order: last_sort_order,
                            }
    
                            galleryArray.push(pVideoDataObj);
                        }
                      
                    }
                }
                // let user detail
                console.log("galleryArray", galleryArray);
                let add_gallery = await Gallery.addGalleryImage(galleryArray);
                let user_detail = await Gallery.getGallery(user_id);
                console.log("user_detailuser_detailuser_detail===", user_detail)
                return res.status(200).json({ status: true, message: "Uploaded Successfully", data: user_detail.status ? user_detail.data : [] });
               
            }
        }
        return res.status(200).json({ status: true, message: "Nothing to upload" });
    },
    
    getVideoThumb: async(data) => {
        return new Promise(async(resolve, reject) => {
            try {
                // let { file_url } = data;
                let actualimagepath = data
                let file_name = `${new Date().getTime()}.jpeg`;
                // let localPath = path.join(__dirname, "../assets/product_media/thumb/" + file_name)
                let localPath = path.resolve(`server/assets/user_gallery/thumbnail/${file_name}`)
                let thumbnail_time = '00:00:02';
              
                Thumbler({
                    type: 'video',
                    input: actualimagepath,
                    output: localPath,
                    time: thumbnail_time,
                }, async function(err, resp) {
                    if (err) {
                       console.log("erroe", err)
                        return resolve(helpers.showResponse(false, "Thumb Error", null, null, 200));
                    }
                    console.log("thumbnail generated")
                    return resolve(helpers.showResponse(true, "Thumb found", { path: "user_gallery/thumbnail/" + file_name }, null, 200));
                })
            } catch (err) {
                console.log(err, " : err")
                resolve(helpers.showResponse(false, err.message, null, null, 200));
            }
        })
    },

    
    // addProfileGallery: async(req, res) => {
    //     let _id = req.decoded.user_id;
    //     if (!_id) {
    //         return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
    //     }
    //     let user_id = _id;
    //      console.log("user_id",user_id);
    //     let requiredFields = ['last_sort_order'];
    //     let validator = helpers.validateParams(req, requiredFields);
    //     if (!validator.status) {
    //         return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    //     }

        
    //     let last_sort_order = req.body.last_sort_order;
    //     let local_profile = '';
    //     // check if profile exist
    //     let user_d = await Users.userExist(user_id);
    //     if (user_d.status) {
    //         local_profile = user_d.data.profile_pic;
    //         console.log("localprofile", local_profile);
    //     }
    //     if (req.files) {
    //         if (req.files.gallery_media) {
    //             console.log('length',req.files.gallery_media.length)
    //             for (let i = 0; i < req.files.gallery_media.length; i++) {
    //                 last_sort_order = parseInt(last_sort_order) + 1;
    //                 let mime_type = req.files.gallery_media[i].mimetype.split("/");
    //                 mime_type = mime_type[0];
    //                 if (mime_type === "image") {
    //                      console.log("iamge here")
    //                     let pData = {
    //                             user_id,
    //                             media: "user_gallery/" + req.files.gallery_media[i].filename,
    //                             media_type: mime_type,
    //                             is_profile: 0,
    //                             sort_order: last_sort_order,
    //                         }
    //                         // if (local_profile === "") {
    //                         //     //set image as profile
    //                         //     pData.is_profile = 1;
    //                         //     //update user profile
    //                         //     let profileData = {
    //                         //         _id: user_id,
    //                         //         profile_pic: pData.media,
    //                         //     }
    //                         //     let profile = await Users.updateUserProfile(profileData);
    //                         //     if (!profile.status) {
    //                         //         return helpers.showResponse(false, Messages.PROFILE_UPDATE_FAILURE, null, null, 200);
    //                         //     }
    //                         //     local_profile = pData.media;
    //                         // }
    //                     // INPUT_path_to_your_images = req.files.gallery_media[i].path;
    //                     // console.log('input', INPUT_path_to_your_images)
    //                     // OUTPUT_path = "server/assets/user_gallery/compress_images/";
    //                     // console.log('output', OUTPUT_path)
    //                     // compress_images(INPUT_path_to_your_images, OUTPUT_path, { compress_force: false, statistic: true, autoupdate: true }, false, { jpg: { engine: "mozjpeg", command: ["-quality", "80"] } }, { png: { engine: "pngquant", command: ["--quality=60-80", "-o"] } }, { svg: { engine: "svgo", command: "--multipass" } }, { gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] } },
    //                     //     async function(error, completed, statistic) {
    //                             // console.log("-------------");
    //                             // console.log("error", error);
    //                             // console.log(completed);
    //                             // console.log(statistic);
    //                             // let a = statistic.path_out_new.substring(statistic.path_out_new.lastIndexOf('/') + 1)
    //                             // console.log(a)
    //                             // pData.compress_image = `user_gallery/compress_images/${a}`
    //                             // console.log("-------------");
    //                             if (local_profile == "") {
    //                                 //set image as profile 
    //                                 pData.is_profile = 1;
    //                                 //update user profile 
    //                                 let profileData = {
    //                                     _id: user_id,
    //                                     profile_pic: pData.media,
    //                                 }
    //                                 let profile = await Users.updateUserProfile(profileData);
    //                                 if (!profile.status) {
    //                                     return helpers.showResponse(false, Messages.PROFILE_UPDATE_FAILURE, null, null, 200);
    //                                 }
    //                                 local_profile = pData.media;
    //                             }
    //                             await Gallery.addGalleryImage(pData);
    //                         // }
    //                     // );
    //                     console.log('one')

    //                     console.log(pData)
    //                 } else if (mime_type === "video") {
    //                     console.log('video')
    //                     let actualimagepath = `http://localhost:5068/files/user_gallery/${req.files.gallery_media[i].filename}`
    //                     let thumbnail_file_name = `${new Date().getTime()}.jpeg`;
    //                     let localPath = path.resolve(`server/assets/user_gallery/thumbnail/${thumbnail_file_name}`)
    //                     Thumbler({
    //                         type: 'video',
    //                         input: actualimagepath,
    //                         output: localPath,
    //                         time: '00:00:02',
    //                         // size: '1024*1024', // this optional if null will use the desimention of the video
    //                     }, async function(err, path) {
    //                         if (err) {
    //                             console.log("thumberr", err)
    //                             return helpers.showResponse(false, Messages.THUMBNAIL_ERROR, err, null, 200);
    //                         }

    //                         let pVideoDataObj = {
    //                             user_id,
    //                             media: "user_gallery/" + req.files.gallery_media[i].filename,
    //                             thumbnail: "user_gallery/thumbnail/" + thumbnail_file_name,
    //                             media_type: mime_type,
    //                             sort_order: last_sort_order,
    //                         }
    //                         console.log("pVideoDataObj", pVideoDataObj)
    //                         await Gallery.addGalleryImage(pVideoDataObj)
    //                     });
    //                 }
    //             }
    //             // let user detail
    //             let user_detail = await Gallery.getGallery(user_id);
    //             console.log("user_detail", user_detail);

    //             return res.status(200).json({ status: true, message: "Uploaded Successfully", data: user_detail.status ? user_detail.data : [] });
    //         }
    //     }
    //     return res.status(200).json({ status: true, message: "Nothing to upload" });
    // },


    getUserDetail: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let user_id = _id
        let result = await Users.getUserDetail(user_id);
        return helpers.showOutput(res, result, result.code);
    },

    uploadProfileVerificationImages: async(req, res) => {
        let _id = req.decoded.user_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['type'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        if (!req.files) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.IMAGE_NOT_SELECTED), 403);
        }

       

        if (req.files.first_image) {
            let converted_image = await sharpFile.convertImageToWebp(req.files.first_image[0]);
            req.body.first_image = converted_image.status?converted_image.data?.Key:"";
        }
        if (req.files.second_image) {
            let converted_image = await sharpFile.convertImageToWebp(req.files.second_image[0]);
            req.body.second_image = converted_image.status?converted_image.data?.Key:"";

        }
        req.body.user_id = _id;

         console.log("==req.body", req.body)
        let result = await Users.updateVerificationImages(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    getChatUserDetails: async(req, res) => {
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
        let result = await Users.getChatUserDetails(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    chatWithConnectionOnly: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['status']; // 0 || 1
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = user_id;
        let result = await Users.chatWithConnectionOnly(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    expireOtp: async(req, res) => {

        let requiredFields = ['phone_number'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }

        let result = await Users.expireOtp(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    updateSubscription: async(req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['has_subscribed'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }

        req.body.user_id = user_id;
        let result = await Users.updateSubscription(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    logout: async(req, res) => {
        let result = await Users.logout(req.body)
        if (result) {
            res.send(result)
        }
        res.json({ status: false, message: "Something went wrong" })
    },

    //===============++++Admin Apis++++===================
    getAllUsers: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['page'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Users.getAllUsers(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    updateUserStatus: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }

        let requiredFields = ['user_id', 'status'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Users.updateUserStatus(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    verifyUserProfile: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['user_id', 'type', 'status'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Users.verifyUserProfile(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    getChatUserDetailsAdmin: async(req, res) => {
        let _id = req.decoded.admin_id;
        if (!_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['user_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Users.getChatUserDetailsAdmin(req.body);
        return helpers.showOutput(res, result, result.code);
    },

    chatVideoUpload: async(req, res) => {
        videoUpload(req, res, async(err) => {
            let { filename } = req.file;
            req.body.media = "videos/" + filename;
            return helpers.showOutput(res,  {status:true, data:req.body.media}, 200);
        })
    },
    getVideo: async(req, res) => {
        videoUpload(req, res, async(err) => {
            let { filename } = req.file;
            req.body.media = "videos/" + filename;
            return helpers.showOutput(res,  {status:true, data:req.body.media}, 200);
        })
    },

    //delete user account 
    deleteAccount: async (req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        req.body.user_id = user_id;
        let result = await Users.deleteAccount(req.body);
        return helpers.showOutput(res, result, result.code);
    },
    //verify user phone number while updating profile 
    sendVerificationCode: async (req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['country_code', 'phone_number'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = user_id;
        let result = await Users.sendVerificationCode(req.body);
        return helpers.showOutput(res, result, result.code);
    }, 
    verifyVerificationCode: async (req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        let requiredFields = ['otp'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        req.body.user_id = user_id;
        let result = await Users.verifyVerificationCode(req.body);
        return helpers.showOutput(res, result, result.code);
    }, 
    expireVerificationCode: async (req, res) => {
        let user_id = req.decoded.user_id;
        if (!user_id) {
            return helpers.showOutput(res, helpers.showResponse(false, Messages.USER_DOESNT_EXIST), 403);
        }
        req.body.user_id = user_id;
        let result = await Users.expireVerificationCode(req.body);
        return helpers.showOutput(res, result, result.code);
    }, 
    //website api for contact us 
    contactUs: async (req, res) => {
        let requiredFields = ['name', 'email', 'message'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
            return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
        }
        let result = await Users.contactUs(req.body);
        return helpers.showOutput(res, result, result.code);
    },

}

module.exports = {...userController }