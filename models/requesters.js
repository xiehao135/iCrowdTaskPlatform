const mongoose = require("mongoose");
const validator = require("validator");
const passportLocalMongoose = require('passport-local-mongoose')
//Create schema
const requesterSchema = new mongoose.Schema({
    country:{
        type:String,
        required:[true,'Should input country']
    },
    firstName:{
        type:String,
        required:[true,'Should input firstname']
    },
    lastName:{
        type:String,
        required:[true,'Should input lastname']
    },
    email:{
        type:String,
        required:[true,'Should input email'],
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('The email is not valid')
            }
        }
    },
    password:{
        type:String,
        required:[true,'Should input password'], 
        validate(value){
            if(this.confirmPwd !== value){
                throw new Error('Password and confirm password are not the same')
            }
        }
    },
    confirmPwd:{
        type:String,
        required:[true,'Should input confirm password'],
    },
    PwdLength:{
        type:Number,
        min:[8,'The password must be at least 8 charactes']
    },
    address:{
        type:String,
        required:[true,'Should input address'],
    },
    city:{
        type:String,
        required:[true,'Should input city'],
    },
    area:{
        type:String,
        required:[true,'Should input state, province and region'],
    },
    code:String,
    phoneNumber:{
        type:String,
        validate(value){
            if(!validator.isMobilePhone(value)){
                throw new Error('The phone number is not valid')
            }
        }
    }
})

//requesterSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("requester",requesterSchema);