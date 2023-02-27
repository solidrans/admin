require('../../db_functions')
let Splash = require('../../models/IntroScreens')
let Messages = require("./message");
let helpers = require('../../services/helper')
let ObjectId = require('mongodb').ObjectId
let moment = require('moment')

const  splashUtils= {
    getSplashScreens:async()=>{
        let queryObject = {status:{$eq:1}}
        let result = await getDataArray(Splash, queryObject,'');
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
    },
    addSplash :async(data)=>{
        console.log(data);
        let {title , description ,media } = data;
        let splashData = {
            title,
            description,
            media
        }
        let userRef = new Splash(splashData)
        let result = await postData(userRef);
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_ADDED_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_ADDED_FAILURE, null, null, 200);
    }

}

module.exports = { ...splashUtils }