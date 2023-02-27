require('../../db_functions')
let Services = require('../../models/Services')
let Users = require('../../models/Users')
let Messages = require("./message");
let helpers = require('../../services/helper')
let ObjectId = require('mongodb').ObjectId
let moment = require('moment');


const  serviceUtils= {
    addService :async(data)=>{
        let {user_id ,service_name , price, time_in , time_out, available_days, description , service_image ,description } = data;
        let serviceData = {
            professional_id:ObjectId(user_id),
            service_name,
            price,
            time_in,
            time_out,
            available_days,
            description,
            service_image,  
            description, 
            created_at:moment.unix()
        }
        let dataRef = new Services(serviceData)
        let result = await postData(dataRef);
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_ADDED_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_ADDED_FAILURE, null, null, 200);
    },

    getProfessionalByCategory :async(data)=>{
        let {category_id ,city ,state} = data;

        let queryObject = {category_id:ObjectId(category_id) ,status:{$eq:1}}

        if(city){
                queryObject.city= city;
        }
        if(state){
                queryObject.state= state;
        }

        let result = await getDataArray(Users, queryObject,'');
        // console.log("🚀 ~ file: index.js ~ line 38 ~ getProfessionalByCategory:async ~ result", result)
        
        if (result.status) {
            return helpers.showResponse(true, Messages.DATA_FOUND_SUCCESS, result.data, null, 200);
        }
        return helpers.showResponse(false, Messages.DATA_NOT_FOUND, null, null, 200);
        
     
    }
}

module.exports = { ...serviceUtils }