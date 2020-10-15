const express = require('express');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const brcypt = require('bcryptjs');
const config = require('config');
const { check, validationResult } = require('express-validator');
const router = express.Router();

// @route           GET api/auth
// @description     Test route
// @access          Public
router.get('/', auth, async (req, res) => {
    try {
        // .select('password') is so that the parameter password will not be included in the return
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route           POST api/auth
// @description     Authenticate user & get token
// @access          Public
router.post('/', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }

    // Destructure body
    const {email, password} = req.body;

    try {
        // See if user exists
        let user  = await User.findOne({ email })

        if(!user){
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }
        
        // Make sure that the password matches using bcrypt
        const isMatch = await brcypt.compare(password, user.password);

        if(!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

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