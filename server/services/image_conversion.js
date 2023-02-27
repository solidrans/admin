
const sharp = require('sharp');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
let Fs = require('fs')

// aws.config.update({
//     accessKeyId     : process.env.AccessKeyId,
//     secretAccessKey : process.env.SecretAccessKey,
//     region          : process.env.Region
//   });

// const s3 = new aws.S3();

const s3 = new aws.S3({
    accessKeyId: process.env.AccessKeyId,              // accessKeyId that is stored in .env file
    secretAccessKey: process.env.SecretAccessKey  , 
    region : process.env.Region   // secretAccessKey is also store in .env file
})




const convertImageToWebp = (data) => {
    return new Promise((resolve, reject) => {
         console.log("DATA in convertImage==", data)
        sharp(data?.buffer).webp({ quality: 50 })
            .toBuffer()
            .then(async(newBuffer) => {
                let upload_= await uploadToS3(data,newBuffer)
                resolve(upload_);;
            })
            .catch((err) => {
                resolve(false)
            });
    })
}

const uploadToS3 = async(file, bufferImage) => {
    return new Promise((resolve, reject) => {
        let fileName = Date.now().toString()+".webp"
        let path="";
        switch(file.fieldname){
          case "gallery_media":
            path = "app_images/gallery_media/"+fileName;
            break;
          case "first_image":
            path = "app_images/user_documents/"+fileName;
            break;
          case "second_image":
            path = "app_images/user_documents/"+fileName;
            break;
          case "admin_first_image":
            path = "app_images/verification_images/"+fileName;
            break;
          case "admin_second_image":
            path = "app_images/verification_images/"+fileName;
            break;
          case "interested_in_icon":
            path = "app_images/interested_in/"+fileName;
            break;
          case "connection_images":
            path = "app_images/connection_type/"+fileName;
            break;
          default:
            path = "app_images/"+fileName;
        }
        const params = {
            Bucket: process.env.Bucket,  
            ContentType:"image/webp",
            Key:path,
            Body: bufferImage,
        }
         
         console.log("params==", params)
         s3.upload(params, async (error, data) => {
            if (error) {
                console.log('bucketerror', error)
                resolve({status:false, message:"Unable to upload in s3"}) // if we get any error while uploading error message will be returned.
            }
            resolve({status:true, message:"image_uploaded",data:data})
        })

    });



    // const storage = multerS3({
    //     metadata: function (req, file, cb) {
    //         cb(null, { fieldName: file.fieldname });
    //     },
    //     acl: 'public-read',
    //     s3,
    //     contentType: multerS3.AUTO_CONTENT_TYPE,
    //     bucket: process.env.Bucket,
    //     key: function (req, file, cb) {
    //         let ext = file.originalname.split(".");
    //         ext = ext[ext.length - 1];
    //         let fileName = Date.now().toString() + "." + ext
    //         let path = "";
    //         console.log("===========", fileName);
    //         switch (file.fieldname) {
    //             case "medicine_images":
    //                 path = "medicine/" + fileName;
    //                 break;
    //             default:
    //                 path = "app_images/" + fileName;
    //         }
    //         cb(null, path);
    //     }
    // });


}
const uploadVideoInBucket = async(file) => {
    return new Promise((resolve, reject) => {
        let fileName = Date.now().toString()+".mp4"
        let path="";
        switch(file.fieldname){
          case "gallery_media":
            path = "app_images/gallery_media/"+fileName;
            break;
          default:
            path = "app_images/"+fileName;
        }
        const params = {
            Bucket: process.env.Bucket,  
            ContentType:"video/mp4",
            Key:path,
            Body: file.buffer,
        }
         console.log("params==", params)
         s3.upload(params, async (error, data) => {
            if (error) {
                console.log('bucketerror', error)
                resolve({status:false, message:"Unable to upload in s3"}) // if we get any error while uploading error message will be returned.
            }
            //create thumbnail form link 
            resolve({status:true, message:"video_uploaded",data:data})
        })

    });

}

module.exports = {
    convertImageToWebp,
    uploadVideoInBucket
}