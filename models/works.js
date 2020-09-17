const mongoose = require("mongoose");
const validator = require("validator");
//Create schema
const workerSchema = new mongoose.Schema({
    worker_id:{
        type:Number,
        default: Math.floor( Math.random() * (999-100) + 100 )
    },
    worker_name:{
        type:String,
        required:[true,'Should input name']
    },
    worker_password:{
        type:String,
        minlength:[8,'The password must be at least 8 charactes'],
        required:[true,'Should input password']
    },
    worker_email:{
        type:String,
        required:[true,'Should input email'],
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('The email is not valid')
            }
        }
    },
    worker_phoneNumber:{
        type:String,
        required:[true,'Should input password'],
        validate(value){
            if(!validator.isMobilePhone(value)){
                throw new Error('The phone number is not valid')
            }
        }
    }
})

module.exports = mongoose.model("worker",workerSchema)