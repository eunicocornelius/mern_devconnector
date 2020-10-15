const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route           POST api/users
// @description     Register user
// @access          Public
router.post('/', [
    // Express Validator: To provide feedback API so that we can display the error message on the frontend
    check('name','Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({min: 6})
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }

    // Destructure body
    const {name, email, password} = req.body;

    try {
        // See if user exists
        let user  = await User.findOne({ email })

        if(user){
            return res.status(400).json({errors: [{msg: 'User already exists'}]})
        }
        
        // Get users gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name,
            email,
            avatar,
            password
        })

        // Encrypt the password using Bcrypt
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // return the JWT
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            {
                //default is 3600
                expiresIn:360000
            },
            (err, token) => {
                if(err) throw err;
                res.json({token});
            });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }


});

module.exports = router;