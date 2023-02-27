const aws         = require('aws-sdk');
const multer      = require('multer');
const multerS3    = require('multer-s3');
const sharp    = require('sharp');


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
     cb(null, true);
//   if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/*') {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type, only JPEG and PNG is allowed!'), false);
//   }
}

const upload_s3 = multer({
  fileFilter,
  storage : storage
});

module.exports = upload_s3;