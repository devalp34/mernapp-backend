const fs = require('fs');
const HttpError = require('../models/http-error');
//const uuid = require('uuid');
const { validationResult } = require('express-validator');
const getCoords = require('../utils/location');
const Place = require('../models/place');
const UserModel = require('../models/user');
const mongoose = require('mongoose');
//const ObjectId = require('mongodb').ObjectId;

const getPlaceById = async (req,res,next) => {
    const pid = req.params.placeId;
    //const opid = ObjectId(pid);
    console.log("pid :"+pid);

    let place;
    try{
        place = await Place.find({_id : pid});
        //place = await Place.find({id : pid});
    } catch (err) {
        return next(new HttpError("Something went wrong",500))
    }
    
    if(!place){
        return next(new HttpError("Place didn't found",404));
    }
    res.json({place : place});
    //res.json({place : place.toObject({getters : true})});
}

const getPlacesByUserId = async (req,res,next) => {
    const uid = req.params.userId;
    //console.log("uid :"+uid);

    let places;
    try{
        places = await Place.find({creator : uid});
        //console.log("places :"+places);
    } catch(err) {
        return next(new HttpError('Something went wrong',500));
    }
    
    if(!places || places.length == 0){
        return next(new HttpError("couldn't find place",404));
    }

    //console.log("before : "+places);
    places.map(p => p.toObject({getters : true}));
    //console.log("after : "+places);
    return res.status(201).json({place : places});
}

const createPlace = async (req,res,next) => {
    console.log("from create place :");
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return next(new HttpError('invalid input',422));
    }

    const{title, description, address, creator} = req.body;
    let location; 
    
    try {
        location = await getCoords(address);
    } catch(error) {
        return next(error);
    }

    const tempPlace = new Place({
        title,
        description,
        address,
        location,
        creator,
        image : req.file.path
    })

    let user;
    try{
        user = await UserModel.findById(creator);
    } catch (err) {
        return next(new HttpError('Creating place filed',500));
    }

    if(!user){
        return next(new HttpError('Couldnt find user',404));
    }
    //console.log(user);

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await tempPlace.save({session : sess });
        user.places.push(tempPlace);
        await user.save({session : sess});
        await sess.commitTransaction();
    } catch (err){
        return next(new HttpError('creating failed',500));
    }

    return res.status(201).json({msg : "created"});
}

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    
    if(!errors.isEmpty()){
        //console.log(errors);
        return next(new HttpError('invalid input',422));
    }

    const{title, description} = req.body;
    const pid = req.params.placeId;

    let updatedPlace;
    try{
        updatedPlace = await Place.findById(pid);
    } catch(err) {
        return next(new HttpError("place didn't found",404));
    }
    // console.log("title : "+title+" descr : "+description);
    // console.log("udated Place : "+updatedPlace);

    if(updatedPlace.creator.toString() != req.userData.userId){
        return next(new HttpError("You are not allowed to change",401));
    }

    updatedPlace.title = title;
    updatedPlace.description = description;
    
    try{
        updatedPlace.save();
    } catch(err) {
        return next(new HttpError("Something went wrong",500));
    }
    
    res.status(200).json({place : updatedPlace.toObject({getters : true})});
}

const deletePlace = async (req, res, next) => {
    const placeID = req.params.placeId;
    //console.log("placeId :"+placeID);
    let temp;
    try {
        temp = await Place.findById(placeID).populate('creator');
    } catch(err) {
        next(new HttpError('Place didnt found',404));
    }

    if(!temp){
        return next(new HttpError('couldnt find place',404));
    }

    if(temp.creator.id != req.userData.userId){
        return next(new HttpError("You are not allowed to delete",401));
    }

    const imagePath = temp.image;
    //console.log(imagePath);

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await temp.remove({ session : sess });
        temp.creator.places.pull(temp);
        await temp.creator.save({ session : sess });
        sess.commitTransaction();
    } catch(err) {
        return next(new HttpError('Something went wrong',500));
    }
    fs.unlink(imagePath, err => {
        console.log(err);
    });
    res.status(200).json({msg : 'deleted Place'});
}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;