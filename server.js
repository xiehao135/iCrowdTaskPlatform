const express = require("express");
const bodyParser = require("body-parser");
const validator = require("validator");
//getting-started.js
const mongoose = require('mongoose');
const Requester = require("./models/requesters.js")
const Worker = require("./models/works.js")
//Get hash method
const bcrypt = require('bcrypt');
const saltRounds = 10;
//Get sendgrid method
const sgMail = require('@sendgrid/mail');
//Get session method
// const session = require('express-session');
// const passport = require('passport');

//Get cookies method
const cookieParser = require("cookie-parser");

//Get Google signin 
var Session = require('express-session');
var google = require('googleapis');
var OAuth2 = google.Auth.OAuth2Client;
var ClientId = '866249875368-k04p5k0uk52k4j93lgvebgfttvfoujlk.apps.googleusercontent.com';
var ClientSecret = '_h-wtubugxB1UDNNEDj_By84';
var RedirectionUrl = 'https://icrowdtaskhao.herokuapp.com/reqtask'

const app = express()
//Create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({extended:true}));
//Use image
app.use(express.static('public'))
app.use(cookieParser())
app.use(Session({
    secret:'$$$GoogleSecret',
    resave:true,
    saveUninitialized:true
}))
// app.use(session({
//     secret:'keyboard cat',
//     resave: false,
//     saveUninitialized: false,
//     cookie:{maxAge:12000}
// }))
// app.use(passport.initialize())
// app.use(passport.session())

// passport.use(Requester.createStrategy())
// passport.serializeUser(Requester.serializeUser())
// passport.deserializeUser(Requester.deserializeUser())

var errorMessage = "";

var verificationCode ="";

//Sendgrid configuration 
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.get('/',function(req,res){
    res.sendFile(__dirname+'/public/reqlogin.html') 
})

app.get('/reqsignup',function(req,res){
    res.sendFile(__dirname+'/reqsignup.html')
})

app.get('/process_signin_with_google',function(req,res){
    var url = getAuthurl()
    res.cookie('emailcookie','Google account',{ expires: new Date(Date.now() + 900000), httpOnly: false })
    res.redirect(url);
})

app.get('/reqtask',function(req,res){
    if(req.cookies.emailcookie){
         res.sendFile(__dirname+'/public/reqtask.html')
    }else{
        res.sendFile(__dirname+'/public/reqlogin.html') 
    }
})

mongoose.set('useCreateIndex', true)

//Post method for request signin
app.post('/process_signin_post',function(req,res){
    mongoose.connect('mongodb://127.0.0.1:27017/iCrowdTaskDB',{useNewUrlParser: true, useUnifiedTopology: true});
    
    const requester = Requester;

    requester.findOne({email:req.body.checkEmail},(err,docs)=>{
        if(docs==null){
            res.send('Wrong email!')
        }else{
            bcrypt.compare(req.body.checkPassword,docs.password,function(err,result){
                if(result == true){
                    if(req.body.rememberMe === 'on'){
                        res.cookie('emailcookie',req.body.checkEmail,{ expires: new Date(Date.now() + 900000), httpOnly: false })
                        res.cookie('passwordcookie',req.body.checkPassword,{ expires: new Date(Date.now() + 900000), httpOnly: false })
                        res.redirect('/reqtask')
                    }else{
                        res.cookie('emailcookie',req.body.checkEmail,{ expires: new Date(Date.now() + 900000), httpOnly: false })
                        res.clearCookie('passwordcookie')
                        res.redirect('/reqtask')
                    }
                }else{
                    res.send('Wrong password')
                }
            })
        }
        mongoose.connection.close();
    })  
})

//Post method for request signup
app.post('/process_signup_post',function(req,res){
    mongoose.connect('mongodb://icrowdtaskhao.herokuapp.com/iCrowdTaskDB')
    
    const requester = Requester;

    //Used for mongoDB schema
    const userInfo = {
        country:req.body.inputCountry,
        firstName:req.body.inputFirstname,
        lastName:req.body.inputLastname,
        email:req.body.inputEmail,
        password:req.body.inputPassword,
        confirmPwd:req.body.inputConfirmPassword,
        PwdLength:0,
        address:req.body.inputAddress+req.body.inputAddress1,
        city:req.body.inputCity,
        area:req.body.inputArea,
        code:req.body.inputZip,
        phoneNumber:req.body.inputPhone
    }

    // Used for sendgrid email 
    const msg = {
        to:req.body.inputEmail,
        from:'1277215092@qq.com',//Use the email address or domain you verified above
        subject:'Welcome Email',//'Sending with Twilio SendGrid is Fun'
        text:'iCrowdTask will provide excellent service for you',//'and easy to do anywhere, even with Node.js'
        html:' Dear<strong> '+ userInfo.firstName+'</strong><br/>Congratulations on your successful registration'
    }

    bcrypt.genSalt(saltRounds, function(err,salt){
        bcrypt.hash(req.body.inputPassword, salt, function(err, hash){
            
            const document = new requester({
                country:userInfo.country,
                firstName:userInfo.firstName,
                lastName:userInfo.lastName,
                email:userInfo.email,
                password:hash,
                confirmPwd:hash,
                PwdLength:userInfo.password.length,
                address:userInfo.address,
                city:userInfo.city,
                area:userInfo.area,
                code:userInfo.code,
                phoneNumber:userInfo.phoneNumber
            })

            document.save((err,docs)=>{
                if(err) {
                    if(err.errors['country'])
                        errorMessage = errorMessage + err.errors['country'].message+";";
                    if(err.errors['firstName'])
                        errorMessage = errorMessage + err.errors['firstName'].message+";";
                    if(err.errors['lastName'])
                        errorMessage = errorMessage + err.errors['lastName'].message+";";
                    if(err.errors['email'])
                        errorMessage = errorMessage + err.errors['email'].message+";";
                    if(err.errors['password'])
                        errorMessage = errorMessage + err.errors['password'].message+";";
                    if(err.errors['confirmPwd'])
                        errorMessage = errorMessage + err.errors['confirmPwd'].message+";";
                    if(err.errors['PwdLength'])
                        errorMessage = errorMessage + err.errors['PwdLength'].message+";";
                    if(err.errors['address'])
                        errorMessage = errorMessage + err.errors['address'].message+";";
                    if(err.errors['city'])
                        errorMessage = errorMessage + err.errors['city'].message+";";
                    if(err.errors['area'])
                        errorMessage = errorMessage + err.errors['area'].message+";";
                    if(err.errors['phoneNumber'])
                        errorMessage = errorMessage + err.errors['phoneNumber'].message+";";
                    res.send(errorMessage);
                    mongoose.connection.close();
                }else{
                    console.log(docs);
                    //Send Email
                    sgMail.send(msg).then(()=>{},error=>{
                        console.error(error);
                        if(error.response){
                            console.error(error.response.body)
                        }
                    });
                    res.redirect('/');
                    mongoose.connection.close();
                }
            })
        
        })
    })   
    errorMessage = ""
})

//Change password
app.post('/process_change_password',function(req,res){
    if(req.body.Button == 'send'){
        //Set verification Code
        verificationCode = Math.floor(Math.random()*10).toString() + Math.floor(Math.random()*10).toString() + Math.floor(Math.random()*10).toString() + Math.floor(Math.random()*10).toString()

        var reg = new RegExp("^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$");
        if(req.body.inputEmail === ''){
            res.send('Please enter your email')
        }else if(!reg.test(req.body.inputEmail)){
            res.send('This emial is invalid!')
        }else{
            // Used for sendgrid email 
            const msg = {
                to:req.body.inputEmail,
                from:'1277215092@qq.com',//Use the email address or domain you verified above
                subject:'Reset Password Email',//'Sending with Twilio SendGrid is Fun'
                text:'iCrowdTask provide verification code for you to reset code',//'and easy to do anywhere, even with Node.js'
                html:' Dear<strong>&nbsp;User</strong><br/>Your verification code is:&nbsp;' + verificationCode
            }

            // Send Email
            sgMail.send(msg).then(()=>{},error=>{
            console.error(error);
            if(error.response){
                console.error(error.response.body)
                }
            });
            console.log(verificationCode)
            res.send('The verification code has been sent to your email, turn back and input it in verification code area!')
        }
    }else if(req.body.Button == 'reset'){
        mongoose.connect('mongodb://127.0.0.1:27017/iCrowdTaskDB',{useNewUrlParser: true, useUnifiedTopology: true});

        const requester = Requester;

        requester.findOne({email:req.body.inputEmail},(err,docs)=>{
            if(docs==null){
                res.send('Please sign up first!')
            }else{
                if(req.body.inputPassword.length < 8){
                    res.send('The password must be at least 8 charactes')
                }else if(req.body.inputPassword != req.body.inputConfirmPassword){
                    res.send('Password and confirm password are not the same')
                }else if(req.body.inputCode == ''){
                    res.send('Please input verification code')
                }else if(req.body.inputCode != verificationCode){
                    res.send('Wrong verification code')
                }else{
                    bcrypt.genSalt(saltRounds, function(err,salt){
                        bcrypt.hash(req.body.inputPassword, salt, function(err, hash){
                            requester.updateOne(
                                {email: req.body.inputEmail},
                                {
                                    password: hash,
                                    confirmPwd: hash,
                                    PwdLength:req.body.inputPassword.length
                                },
                                (err)=>{
                                    if (err) {console.log(err);res.send(err)}
                                    else {
                                        mongoose.connection.close(); 
                                        res.redirect('/');
                                    }
                                }
                            ) 
                        })
                    })
                }
            }
        }) 
    }  
})

//Crowd REST APIs
app.route('/workers')
.get( (req, res)=>{
    mongoose.connect('mongodb://127.0.0.1:27017/CrowdWorkerDB',{useNewUrlParser: true,useUnifiedTopology: true})
    Worker.find((err, workerList)=>{
        if (err) {res.send(err)}
        else {res.send(workerList)}
    })
})
.post( (req,res)=>{
    mongoose.connect('mongodb://127.0.0.1:27017/CrowdWorkerDB',{useNewUrlParser: true,useUnifiedTopology: true})
    const document = new Worker({
        worker_name: req.body.name,
        worker_password: req.body.password,
        worker_email: req.body.email,
        worker_phoneNumber:req.body.phoneNumber
    })
    document.save((err) =>{
        if (err) {res.send(err)}
        else res.send ('Successfully added a new worker!')
    }
    )
})
.delete( (req,res) =>{
    mongoose.connect('mongodb://127.0.0.1:27017/CrowdWorkerDB',{useNewUrlParser: true,useUnifiedTopology: true})
    Worker.deleteMany((err) =>{
        if (err) {res.send(err)}
        else {res.send('Successfully deleted all workers!')}
    })
})

app.route('/workers/:id')
.get((req, res)=>{
    mongoose.connect('mongodb://127.0.0.1:27017/CrowdWorkerDB',{useNewUrlParser: true,useUnifiedTopology: true})
    Worker.findOne({worker_id: req.params.id}, (err, foundWorker)=>{
        if (foundWorker) (res.send(foundWorker))
        else res.send("No Matched Task Found!")
    })
})
.put((req,res)=>{
    mongoose.connect('mongodb://127.0.0.1:27017/CrowdWorkerDB',{useNewUrlParser: true,useUnifiedTopology: true})
    Worker.update(
        {worker_id: req.params.id},
        {
            worker_id: req.params.id,
            worker_name: req.body.name,
            worker_password: req.body.password,
            worker_email: req.body.email,
            worker_phoneNumber:req.body.phoneNumber
        },
        {overwrite:true}, 
        (err)=>{
            if (err) {console.log(err);res.send(err)}
            else {res.send('Successfully updated!')}
        }
    )
})
.patch((req, res)=>{
    mongoose.connect('mongodb://127.0.0.1:27017/CrowdWorkerDB',{useNewUrlParser: true,useUnifiedTopology: true})
    Worker.update(
        {worker_id: req.params.id},
        {$set: req.body},
        (err)=>{
            if (!err) {res.send('Successfully updated!')}
            else {console.log(err);res.send(err)}
        }
    )
})

var port = process.env.PORT
app.listen(port||3000,function(){
    console.log("Server is running on port 3000")
})

/**
 * Create OAuth Client
 */
function getOAuthClient(){
    return new OAuth2(ClientId,ClientSecret,RedirectionUrl)
}

/**
 * Generate url for application
 */
function getAuthurl(){
    var oauth2Client = getOAuthClient()
    // Generate a url using for apply for google login auth
    var scopes = [
        'https://www.googleapis.com/auth/plus.me'
    ]
    var url = oauth2Client.generateAuthUrl({
        //'online' (default) or 'offline' (gets refresh_token)
        access_type:'offline',
        // If you only need one scope you can pass it as a string
        scope: scopes,
        //Optional property that passes state parameters to redirect URL
        state:{foo:'bar'}
    });
    return url;
}
