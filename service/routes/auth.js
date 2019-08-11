'use strict';
const joi = require('joi');
const _ = require('lodash');
const createRouter = require('@arangodb/foxx/router');
const auth = require('../util/auth');

const users = module.context.collection('users');

const User = require('../models/user');

const router = createRouter();
module.exports = router;

router.tag('authentication');

router.post('/login', function (req, res) {
    const username = req.body.username;
    const user = users.firstExample({username});
    const valid = auth.verify(
        user ? user.authData : {},
        req.body.password
    );
    if (!valid) res.throw('unauthorized');
    req.session.uid = user._key;
    req.sessionStorage.save(req.session);
    res.send({success: true});
})
    .body(User.Login, 'Credentials')
    .response(joi.object({success: true}), 'A success message - only true possible')
    .description('Logs a registered user in using the given credentials and places a session cookie.');


router.post('/signup', function (req, res) {
    const user = {};
    try {
        user.authData = req.body.authData;
        user.username = req.body.username;
        user.perms = [];
        const meta = users.save(user);
        Object.assign(user, meta);
    } catch (e) {
        // Failed to save the user
        // We'll assume the uniqueness constraint has been violated
        res.throw('bad request', 'Username already taken', e);
    }
    req.session.uid = user._key;
    req.sessionStorage.save(req.session);
    res.send({success: true});
})
    .body(User.Signup, 'Complete User Information')
    .description('Creates a new user and logs them in.');


router.get('/whoami', function (req, res) {
    try {
        const user = users.document(req.session.uid);
        res.send({username: user.username});
    } catch (e) {
        res.send({username: null});
    }
}).description('Returns the currently active username.');


router.post('/logout', function (req, res) {
    if (req.session.uid) {
        req.session.uid = null;
        req.sessionStorage.save(req.session);
    }
    res.send({success: true});
})
    .description('Logs the current user out.');