const axios = require('axios');
const HttpError = require('../models/http-error');

const API = "AIzaSyDF53K_dwr8cGUr9OPJyqbPZQ_UbIz8fME";
//const API = process.env.GOOGLE_API_KEY;

async function getCoordsForAddress(address){
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${
        encodeURIComponent(address)
    }&key=${API}`);    

    const data = response.data;

    if(!data || data.status == "ZERO_RESULTS"){
        const error = new HttpError('Could not find location',422);
        throw error;
    }

    const coordinates = data.results[0].geometry.location;

    return coordinates;
}

module.exports = getCoordsForAddress;