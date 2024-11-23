const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const User = require('../models/user');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'live.smtp.mailtrap.io',
  port: 587,
  auth: {
    user: 'api',
    pass: '81c1e96ec796d089374daa0360c3083c',
  },
});

// GET Login
exports.getLogin = async (req, res, next) => {
  const message = req.flash('error')[0] || null;
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: { email: '', password: '' },
    validationErrors: [],
  });
};

// GET Signup
exports.getSignup = async (req, res, next) => {
  const message = req.flash('error')[0] || null;
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: { email: '', password: '', confirmPassword: '' },
    validationErrors: [],
  });
};

// POST Login
exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password },
      validationErrors: errors.array(),
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: 'Invalid email or password!',
        oldInput: { email, password },
        validationErrors: [],
      });
    }

    const doMatch = await bcrypt.compare(password, user.password);
    if (doMatch) {
      req.session.isLoggedIn = true;
      req.session.user = user;
      return req.session.save(() => {
        console.log('Logged in');
        res.redirect('/');
      });
    }

    res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: 'Invalid email or password!',
      oldInput: { email, password },
      validationErrors: [],
    });
  } catch (err) {
    next(new Error(err));
  }
};

// POST Signup
exports.postSignup = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password, confirmPassword: req.body.confirmPassword },
      validationErrors: errors.array(),
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedPassword,
      cart: { items: [] },
    });
    await user.save();
    res.redirect('/login');
    // await transporter.sendMail({
    //   to: email,
    //   from: 'shop@demomailtrap.com',
    //   subject: 'Signup successful',
    //   html: '<h1>You signed up successfully!</h1>',
    // });
  } catch (err) {
    next(new Error(err));
  }
};

// POST Logout
exports.postLogout = async (req, res, next) => {
  req.session.destroy(() => {
    console.log('Logged out');
    res.redirect('/');
  });
};

// GET Reset
exports.getReset = async (req, res, next) => {
  const message = req.flash('error')[0] || null;
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message,
  });
};

// POST Reset
exports.postReset = async (req, res, next) => {
  try {
    const buffer = await crypto.randomBytes(32);
    const token = buffer.toString('hex');
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      req.flash('error', 'No account with this email found');
      return res.redirect('/reset');
    }

    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000;
    await user.save();

    res.redirect('/');
    await transporter.sendMail({
      to: req.body.email,
      from: 'shop@demomailtrap.com',
      subject: 'Password Reset',
      html: `
        <p>You requested a password reset.</p>
        <p>Click <a href="https://dekunle-market.onrender.com/reset/${token}">here</a> to set a new password.</p>
      `,
    });
  } catch (err) {
    next(new Error(err));
  }
};

// GET New Password
exports.getNewPassword = async (req, res, next) => {
  const token = req.params.token;
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      req.flash('error', 'Token is invalid or expired.');
      return res.redirect('/reset');
    }

    const message = req.flash('error')[0] || null;
    res.render('auth/new-password', {
      path: '/new-password',
      pageTitle: 'New Password',
      errorMessage: message,
      userId: user._id.toString(),
      passwordToken: token,
    });
  } catch (err) {
    next(new Error(err));
  }
};

// POST New Password
exports.postNewPassword = async (req, res, next) => {
  const { password, userId, passwordToken } = req.body;

  try {
    const user = await User.findOne({
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId,
    });

    if (!user) {
      req.flash('error', 'Invalid or expired token.');
      return res.redirect('/reset');
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.redirect('/login');
  } catch (err) {
    next(new Error(err));
  }
};
