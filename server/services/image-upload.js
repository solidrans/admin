const multer = require('multer');
const path = require('path')

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        console.log("file", file);
        let media_dest = '';
        if (file.fieldname == "splash_image") {
            media_dest = `${__dirname}../../assets/splash`
        } else if (file.fieldname == "user_profile") {
            media_dest = `${__dirname}../../assets/user_profile`
        } else if (file.fieldname == "category_image") {
            media_dest = `${__dirname}../../assets/category`
        } else if (file.fieldname == "gallery_media") {
            media_dest = `${__dirname}../../assets/user_gallery`
        } else if (file.fieldname == "interested_in_icon") {
            media_dest = `${__dirname}../../assets/interested_in`
        } else if (file.fieldname == "connection_images") {
            media_dest = `${__dirname}../../assets/connection_type`
        } else if (file.fieldname == "first_image" || file.fieldname == "second_image" ) {
            media_dest = `${__dirname}../../assets/user_documents`
        } else if (file.fieldname == "admin_first_image" || file.fieldname == "admin_second_image" ) {
            media_dest = `${__dirname}../../assets/verification_images`
        } else if (file.fieldname == "video") {
            media_dest = `${__dirname}../../assets/video`
        }
        cb(null, media_dest)
    },
    filename: function(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
    }
})

const fileFilter = (req, file, cb) => {
    cb(null, true);
}

const upload = multer({
    fileFilter,
    storage
});


module.exports = upload;