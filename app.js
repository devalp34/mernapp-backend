const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const HttpError = require('./models/http-error');
const placesRoutes = require('./routes/places-route');
const usersRoute = require('./routes/users-route');
const mongoose = require('mongoose');
//const Cors = require('cors');

const app = express();

app.use(bodyParser.json());
//app.use(Cors());

app.use('/uploads/images', express.static(path.join('uploads','images')));

app.use((req,res,next) => {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token'
    );
    res.setHeader('Access-Control-Allow-Methods','GET, POST, DELETE, PATCH, OPTIONS');
    next();
});

app.use("/api/places",placesRoutes);
app.use("/api/users", usersRoute);

app.use((req, res, next) => {
    throw new HttpError("route not supported",404);
})

app.use((error, req, res, next) => {
    if(req.file){
        fs.unlink(req.file.path, () => {
            console.log(err);
        });
    }
    if(res.headerSent){
        return next(error);
    }
    res.status(error.code || 500)
        .json({msg : error.message || "unknown error occurred!"});
})

//const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster1.4fhrt.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const url = `mongodb+srv://admin:Minta5678@cluster1.4fhrt.mongodb.net/mern?retryWrites=true&w=majority`;
mongoose
    .connect(url)
    .then(() => {
        console.log("connect..");
        app.listen(process.env.PORT || 5000);
    })
    .catch((err) => {
        console.log("Not connected "+err);
    });