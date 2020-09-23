const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error.js');
const UserModel = require('../models/user');

const getUsers = async (req,res,next) => {
    let listUser;
    
    try{
        listUser = await UserModel.find({}, '-password');
    } catch(err) {
        return next(new HttpError('went wrng in connections',500));
    }
    
    res.json({user : listUser.map(li => li.toObject({ getters : true }))});
}

const signUpUser = async (req,res,next) => {
    const errors = validationResult(req);
    
    if(!errors.isEmpty()){
        //const {name, email,password} = req.body;
        // console.log(name+" "+email+" "+password);
        // console.log(errors);
        return next(new HttpError('invalid input',422));
    }

    const {name, email,password} = req.body;
    let existingUser;
    try{
        existingUser = await UserModel.findOne({email : email});
    } catch(err) {
        return next(new HttpError('Something went wrong during connection',500));
    }
    
    if(existingUser){
        return next(new HttpError('User already present',422));
    }
    
    let hashedPassword;
    try{
        hashedPassword = await bcrypt.hash(password,12);
    } catch(err) {
        next(new HttpError("Couldn't create user please try again",500));
    }

    const tempUser = new UserModel({
        name,
        email, 
        password : hashedPassword,
        image : req.file.path,
        places : []
    })

    try{
        await tempUser.save();
    } catch(err) {
        return next(new HttpError('Something went wrong during saving',500));
    }
    
    let token;
    try{
        token = jwt.sign(
            {userId : tempUser.id, email : tempUser.email},
            "supersecret..",
            {expiresIn : '1h'}
        );
    } catch(err) {
        return next(new HttpError('Signingup failed',500));
    }
    

    //res.status(201).json({user : tempUser.toObject({getters : true})});
    res.status(201).json({
        userId: tempUser.id, 
        email : tempUser.email,
        token : token
    });
}

const loginUser = async (req,res,next) => {
    const{email,password} = req.body;
    
    let existingUser;
    try{
        existingUser = await UserModel.findOne({email : email});
    } catch(err) {
        return next(new HttpError('Something went wrong during connection',500));
    }
    
    if(!existingUser){
        return next(new HttpError('Invalid Credential',401));
    }

    let isValidPassword = false;
    try{
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        return next(new HttpError("not matching with your credential",500));
    }
    
    if(!isValidPassword){
        return next(new HttpError('Wrong password',401));
    }

    let token;
    try{
        token = jwt.sign(
            {userId : existingUser.id, email : existingUser.email},
            "supersecret..",
            {expiresIn : '1h'}
        );
    } catch(err) {
        return next(new HttpError('Logging Failed',500));
    }

    // res.json({msg:"ohoo...Logged in",
    //           user : existingUser.toObject({getters : true})});

    res.json({
        userId : existingUser.id,
        email : existingUser.email,
        token : token
    })
}

exports.getUsers = getUsers;
exports.signUpUser = signUpUser;
exports.loginUser = loginUser;