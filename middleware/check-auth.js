const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');

module.exports = (req,res,next) => {
    if(req.method == 'OPTIONS'){
        return next();
    }

    try{
        const token = req.headers.authorization.split(' ')[1]
        if(!token) {
            throw new Error("error is there");
        }
        
        const calculatetoken = jwt.verify(token, "supersecret..");
        req.userData = {userId : calculatetoken.userId};
        //return;
        return next();

    } catch(err) {
        return next(new HttpError("Authentication failed",401));
    }
}