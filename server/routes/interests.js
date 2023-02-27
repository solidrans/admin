var express = require('express');
var router = express.Router();
var router = express.Router();
var InterestedInController = require('../controllers/InterestedIn');
var middleware = require("../controllers/middleware");

//=======================APP APIS================================
router.post('/get_interesed_in', InterestedInController.getAllInterestedIn);
router.post('/get_all_interests', InterestedInController.getAllInterests);
router.post('/get_connection_type', InterestedInController.getAllConnectionTypes);



// Common Routes
router.get('*', (req, res) => { res.status(405).json({ status: false, message: "Invalid Get Request" }) });
router.post('*', (req, res) => { res.status(405).json({ status: false, message: "Invalid Post Request" }) });
module.exports = router;