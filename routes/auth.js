const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth')

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
    '/login', 
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email')
            .normalizeEmail(),
        body('password', 'Enter atleast 6 characters containing numbers and text')
            .isLength({min: 6})
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin);

router.post(
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email')
            .custom((value, { req }) => {
              return User.findOne({ email: value }).then(userDoc => {
                if (userDoc) {
                  return Promise.reject(
                    'E-Mail exists already, please pick a different one.'
                  );
                }
              });
            })
            .normalizeEmail(),
        body('password', 'Enter atleast 6 characters containing numbers and text')
            .isLength({min: 6})
            .isAlphanumeric()
            .trim(),
        check('confirmPassword')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match')
        .trim()
    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;