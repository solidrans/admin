var express = require('express');
var router = express.Router();
var UsersController = require('../controllers/Users');
var GalleryController = require('../controllers/Gallery');
var HomeController = require('../controllers/HomeController');
var FaqController = require('../controllers/Faq');
var NotificationContoller = require('../controllers/Notification');
var BlockController = require('../controllers/BlockUsers');
var middleware = require("../controllers/middleware");
const upload = require('../services/image-upload')
const upload_s3 = require('../services/image-upload-s3')


// Without Token Routes
router.post('/refresh', middleware.refreshToken);
router.post('/register', UsersController.register);
router.post('/verify_otp', UsersController.verifyOtp);
router.post('/phone_alredy_exist', UsersController.phoneNumberExist);

//With Token 
router.post('/get_detail', middleware.checkToken, UsersController.getUserDetail);
router.post('/update_profile', middleware.checkToken, UsersController.updateUserProfile);
router.post('/update_user_interested_in', middleware.checkToken, UsersController.updateUserInterestedIn);
router.post('/update_user_connection_type', middleware.checkToken, UsersController.updateUserConnectionType);
router.post('/update_user_interests', middleware.checkToken, UsersController.updateUserInterests);
router.post('/update_user_location', middleware.checkToken, UsersController.updateUserLocation);
router.post('/update_user_fcm', middleware.checkToken, UsersController.updateUserFcm);
router.post('/update_visible_on_map', middleware.checkToken, UsersController.updateVisibleOnMap);
// router.post('/add_profile_gallery', middleware.checkToken, upload_s3.fields([{ name: 'gallery_media', maxCount: 9 }]), UsersController.addProfileGallery);
router.post('/add_profile_gallery', middleware.checkToken, upload_s3.fields([{ name: 'gallery_media', maxCount: 9 }]), UsersController.addProfileGallery);
router.post('/get_gallery', middleware.checkToken, GalleryController.getGallery);
router.post('/update_gallery_order', middleware.checkToken, GalleryController.updateGalleryOrder);
router.post('/remove_from_gallery', middleware.checkToken, GalleryController.removeFromGallery);
router.post('/set_as_profile', middleware.checkToken, GalleryController.setAsProfile);
router.post('/upload_profile_verifaction_images', middleware.checkToken, upload_s3.fields([{ name: 'first_image', maxCount: 1 }, { name: 'second_image', maxCount: 1 }]), UsersController.uploadProfileVerificationImages);
// router.post('/upload_profile_verifaction_images', upload_s3.fields([{ name: 'first_image', maxCount: 1 }, { name: 'second_image', maxCount: 1 }]), UsersController.uploadProfileVerificationImages);
router.post('/enable_location', middleware.checkToken, UsersController.enableLocation);

//connection list
router.get('/get_home_connections', middleware.checkToken, HomeController.getHomeConnections)
router.post('/left_swipe', middleware.checkToken, HomeController.leftSwipe)
router.post('/right_swipe', middleware.checkToken, HomeController.rightSwipe)
router.post('/swipe_up', middleware.checkToken, HomeController.swipeUp)
router.post('/get_discover_data', middleware.checkToken, HomeController.getDiscoverData)
router.post('/other_user_detail', middleware.checkToken, HomeController.otherUserDetails)
router.post('/undo_left_swipe', middleware.checkToken, HomeController.undoLeftSwipe)
router.post('/get_sent_requests', middleware.checkToken, HomeController.getSentRequests)
router.post('/get_received_requests', middleware.checkToken, HomeController.getReceivedRequests)
router.post('/search_by_username', middleware.checkToken, HomeController.serchByUsername)
router.post('/get_user_by_location', middleware.checkToken, HomeController.getUserByLocation)
router.post('/get_my_connection_list', middleware.checkToken, HomeController.getMyConnectionList)
router.post('/delete_connection', middleware.checkToken, HomeController.deleteConnection)
router.post('/delete_multiple_connection', middleware.checkToken, HomeController.deleteMultipleConnection)
router.post('/delete_sent_request', middleware.checkToken, HomeController.deleteSentRequest)
router.post('/delete_multiple_sent_request', middleware.checkToken, HomeController.deleteMultipleSentConnection)
router.post('/delete_received_request', middleware.checkToken, HomeController.rejectReceivedRequest)

//faq
router.post('/get_faq', middleware.checkToken, FaqController.getAllFaq);

//notifications
router.post('/get_user_notifications', middleware.checkToken, NotificationContoller.getUserNotifications);
router.post('/get_notification_count', middleware.checkToken, NotificationContoller.getUnreadCount);

//veriificaiton image 
router.post('/get_profile_verification_poses', middleware.checkToken, FaqController.profileVerificationPoses);

//chat
router.post('/chat_with_connection_only', middleware.checkToken, UsersController.chatWithConnectionOnly)
router.post('/send_payload_notification', middleware.checkToken, NotificationContoller.sendPayloadNotifcaiotn)
router.post('/get_chat_user_detail', middleware.checkToken, UsersController.getChatUserDetails);
router.post('/get_video_thumb', GalleryController.getVideoThumb);

//block user  & security contacts
router.post('/block_user', middleware.checkToken, BlockController.blockUser)
router.post('/unblock_user', middleware.checkToken, BlockController.unblockUser)
router.post('/get_block_users', middleware.checkToken, BlockController.getBlockedUser)
router.post('/get_my_contact', middleware.checkToken, BlockController.getMyContactUsers)
router.post('/add_security_contacts', middleware.checkToken, BlockController.addSecurityContacts)


//delete account 
router.post('/delete_account', middleware.checkToken, UsersController.deleteAccount);


//otp 1 min expire 
router.post('/expire_otp', UsersController.expireOtp);
router.post('/delete_user', NotificationContoller.deleteUser);

//user subscription
router.post('/update_subscription', middleware.checkToken, UsersController.updateSubscription);

//video upload 
router.post('/upload_video',UsersController.chatVideoUpload);

//contact us
router.post('/contact_us',UsersController.contactUs);


//update profile verification
router.post('/send_verification_code', middleware.checkToken, UsersController.sendVerificationCode)
router.post('/verify_verification_code', middleware.checkToken, UsersController.verifyVerificationCode)
router.post('/expire_verification_code', middleware.checkToken, UsersController.expireVerificationCode)



// Common Routes
router.get('*', (req, res) => { res.status(405).json({ status: false, message: "Invalid Get Request" }) });
router.post('*', (req, res) => { res.status(405).json({ status: false, message: "Invalid Post Request" }) });

module.exports = router;