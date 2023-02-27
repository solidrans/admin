var express = require('express');
var router = express.Router();
var AdminController = require('../controllers/Admin');
var UserController = require('../controllers/Users');
var InterestedInController = require('../controllers/InterestedIn');
var DashboardController = require('../controllers/Dashboard');
var NotificationController = require('../controllers/Notification');
var FaqController = require('../controllers/Faq');
var middleware = require("../controllers/middleware");
const upload = require('../services/image-upload')
const upload_s3 = require('../services/image-upload-s3')


// Admin Routes without admin Token
router.post('/login', AdminController.login);
router.post('/forgot_password', AdminController.forgotPasswordMail);
router.post('/reset_password', AdminController.forgotChangePassword);
router.post('/get_admin_detail', middleware.checkAdminToken, AdminController.getAdminDetail);
router.post('/change_password', middleware.checkAdminToken, AdminController.changePasswordWithOld);
router.post('/update_admin_detail', middleware.checkAdminToken, AdminController.updateAdminDetail);


//dashboard
router.post('/dashboard_data', middleware.checkAdminToken, DashboardController.getDashboardData)

//user section
router.post('/get_all_users', middleware.checkAdminToken, UserController.getAllUsers);
router.post('/update_user_status', middleware.checkAdminToken, UserController.updateUserStatus);
router.post('/verify_user_profile', middleware.checkAdminToken, UserController.verifyUserProfile);

//interested in gender
router.post('/get_interesed_in', middleware.checkAdminToken, InterestedInController.getAllInterestedInAdmin);
router.post('/add_interested_in', middleware.checkAdminToken, InterestedInController.addInterestedIn); //gender
router.post('/update_interested_in', middleware.checkAdminToken, InterestedInController.updateInterestedIn);
router.post('/add_interested_in_subcategory', middleware.checkAdminToken, InterestedInController.addInterestedInSubcategory); //gender
router.post('/get_interested_in_subcategory', middleware.checkAdminToken, InterestedInController.getInterestedInSubcategory);
router.post('/update_interested_in_status', middleware.checkAdminToken, InterestedInController.updateInterestedInStatus);
router.post('/get_all_genders', middleware.checkAdminToken, InterestedInController.getAllGenders);

//all interests
router.post('/get_all_interests', middleware.checkAdminToken, InterestedInController.getAllInterestsAdmin);
router.post('/add_interest', middleware.checkAdminToken, InterestedInController.addInterest);
router.post('/update_interest', middleware.checkAdminToken, InterestedInController.updateInterest);
router.post('/update_interest_status', middleware.checkAdminToken, InterestedInController.updateInterestStatus);
router.post('/update_interest_sort_order', middleware.checkAdminToken, InterestedInController.updateInterestSortOrder);
//add connection type
router.post('/get_connection_type', middleware.checkAdminToken, InterestedInController.getAllConnectionTypesAdmin);
router.post('/add_connection_type', middleware.checkAdminToken, upload_s3.fields([{ name: 'connection_images', maxCount: 10 }]), InterestedInController.addConnectionType);
router.post('/edit_connection_type', middleware.checkAdminToken, InterestedInController.editConnectionType);
router.post('/delete_connection_image', middleware.checkAdminToken, InterestedInController.deleteConnectionImage);
router.post('/add_connection_image', middleware.checkAdminToken, InterestedInController.addConnectionImage);
router.post('/edit_connection_image', middleware.checkAdminToken, InterestedInController.editConnectionImage);
router.post('/get_connection_detail', middleware.checkAdminToken, InterestedInController.getConenctionDetail);
router.post('/drag_drop_connection_images', middleware.checkAdminToken, InterestedInController.dragDropConnectionImages);
router.post('/delete_connection_type', middleware.checkAdminToken, InterestedInController.deleteConnectionType);
//help and support
router.post('/get_faq', middleware.checkAdminToken, FaqController.getAllFaqAdmin);
router.post('/add_faq', middleware.checkAdminToken, FaqController.addFaq);
router.post('/update_faq', middleware.checkAdminToken, FaqController.updateFaq);
router.post('/delete_faq', middleware.checkAdminToken, FaqController.deleteFaq);
//terms & condition  
router.post('/get_terms_conditions', FaqController.getTermsConditions);
router.post('/update_terms_conditions', middleware.checkAdminToken, FaqController.updateTermsConditions);
//verification image 
router.post('/get_verification_images', middleware.checkAdminToken, FaqController.getVerificationImages);
router.post('/add_verification_images', middleware.checkAdminToken, upload_s3.fields([{ name: 'admin_first_image', maxCount: 1 }, { name: 'admin_second_image', maxCount: 1 }]), FaqController.addVerificationImages);
router.post('/activate_verification_status', middleware.checkAdminToken, FaqController.activateVerificationStatus);
router.post('/delete_verification_image', middleware.checkAdminToken, FaqController.deleteVerificationImage);
// notificaation module
router.post('/send_notification', middleware.checkAdminToken, NotificationController.sendAdminNotification);
router.post('/get_notification_list', middleware.checkAdminToken, NotificationController.getAdminNotificationList);
router.post('/get_unread_notification_list', middleware.checkAdminToken, NotificationController.getAdminUnreadNotificationList);
router.post('/clear_all_notification', middleware.checkAdminToken, NotificationController.clearAllNotifications);
router.post('/read_all_notification', middleware.checkAdminToken, NotificationController.markAllRead);

//report section
router.post('/get_all_reports', middleware.checkAdminToken, FaqController.getAllReports);


//chat_user_detail
router.post('/get_user_detail', middleware.checkAdminToken, UserController.getChatUserDetailsAdmin);
// Common Routes
router.get('*', (req, res) => { res.status(405).json({ status: false, message: "Invalid Get Request" }) });
router.post('*', (req, res) => { res.status(405).json({ status: false, message: "Invalid Post Request" }) });
module.exports = router;