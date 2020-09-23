const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

const fileUpload = require('../middleware/file-upload');
const users = require('../controllers/users-controller');

router.get("/",users.getUsers);
router.post(
    '/signup',
    fileUpload.single('image'),
    [
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({min : 6})
],users.signUpUser);
router.post('/login',users.loginUser);
module.exports = router;