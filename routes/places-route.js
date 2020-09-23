const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const fileUpload = require('../middleware/file-upload');
const places = require('../controllers/places-controller');
const checkAuth = require('../middleware/check-auth');

router.get("/:placeId",places.getPlaceById);
router.get('/user/:userId', places.getPlacesByUserId);

router.use(checkAuth);

router.post(
    '/',
    fileUpload.single('image'),
    [
        check('title')
            .not()
            .isEmpty(),
        check('description').isLength({min : 5}),
        check('address')
            .not()
            .isEmpty()
    ],
    places.createPlace);
router.patch('/:placeId',[
    check('title')
        .not()
        .isEmpty(),
    check('description').isLength({min : 5})
],places.updatePlace);
router.delete('/:placeId',places.deletePlace);

module.exports = router;