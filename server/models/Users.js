const mongoose = require('mongoose');
const moment = require('moment')
const Schema = mongoose.Schema;

var userSchema = new Schema({
    country_code: {
        type: String,
        default: ''
    },
    phone_number: {
        type: String,
        default: ''
    },
    otp: {
        type: String,
        default: ""
    },
    is_phone_verified: {
        type: Number,
        default: 0
    },
    username: {
        type: String,
        default: ''
    },
    gender: {
        type: Schema.Types.ObjectId,
        ref: 'InterestedIn'
    },
    email: {
        type: String,
        default: ''
    },
    login_source: {
        type: String,
        default: ''
    },
    auth_token: {
        type: String,
        default: ''
    },
    dob: {
        type: Number,
        default: 0
    },
    age: {
        type: Number,
        default: 0
    },
    driving_license_verification: {
        type: Number,
        default: 0
    },
    background_check_verification: {
        type: Number,
        default: 0
    },
    profile_verification: {
        type: Number,
        default: 0
    },
    profile_verification_images: {
        first_pose: {
            type: String,
            default: ""
        },
        second_pose: {
            type: String,
            default: "",
        }
    },
    profile_verify_sample_id: {
        type: Schema.Types.ObjectId,
        ref: 'VerificationImages'
    },
    driving_verification_images: {
        front_image: {
            type: String,
            default: ""
        },
        back_image: {
            type: String,
            default: "",
        }
    },
    profile_pic: {
        type: String,
        default: ''
    },
    compress_profile_pic: {
        type: String,
        default: ''
    },
    interested_in: [{
        type: Schema.Types.ObjectId,
        ref: 'InterestedIn'

    }],
    // interested_in: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'InterestedIn'

    // },
    my_interests: [{
        interest: {
            type: Schema.Types.ObjectId,
            ref: 'Interests'
        },
        sort_order: {
            type: Number,
            default: 0
        },
        color: {
            type: String,
            default: ''
        }
    }],
    connection_type: [{
        connection: {
            type: Schema.Types.ObjectId,
            ref: 'ConnectionType'
        }
    }],
    location: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    occupation: {
        type: String,
        default: ''
    },
    lat: {
        type: String,
        default: ''
    },
    lng: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    is_location_enabled:{
        type:Number,
        default:0,
    },
    location_obj: {
        type: {type:String},
        coordinates:[]
    },
    notification_status: {
        type: Number,
        default: 0
    },
    visible_on_map: {
        type: Number,
        default: 0
    },
    chat_with_connection_only: {
        type: Number,
        default: 0
    },
    fcm_token: {
        type: String,
        default: ''
    },
    status: {
        type: Number,
        default: 1
    },
    verification_request_at: { // for admin panel verification status view 
        type: Number,
        default: 0
    },
    key: {
        type: Number,
        default: 0,
    },
    has_subscribed: {
        type: Number,
        default: 0,
    },
    subscription_data: {
        type: Object,
        default: {},
    },
    delete_reason: {
        type: String,
        default:"",
    },
    created_at: {
        type: Number,
        default: moment().unix()
    },
    updated_at: {
        type: Number,
        default: moment().unix()
    }
});
userSchema.index({location_obj: '2dsphere'});
module.exports = mongoose.model('Users', userSchema, 'users')