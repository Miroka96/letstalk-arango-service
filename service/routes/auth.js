'use strict';
const joi = require('joi');
const _ = require('lodash');
const createRouter = require('@arangodb/foxx/router');
const auth = require('../util/auth');

const users = module.context.collection('users');

const User = require('../models/user');

const createUser = require('../util/createUser');

const router = createRouter();
module.exports = router;

router.tag('authentication');

router
    .post('/login', function (req, res) {
        const username = req.body.username;
        const user = users.firstExample({username});
        const valid = auth.verify(
            user ? user.authData : {},
            req.body.password
        );
        if (!valid) res.throw('unauthorized');
        req.session.uid = user._key;
        req.sessionStorage.save(req.session);
        res.send({username: user.username, _key: user._key});
    })
    .body(User.Login, 'Credentials')
    .response(User.Identity, 'Identifying information')
    .description('Logs a registered user in using the given credentials and places a session cookie.');


router
    .post('/signup', function (req, res) {
        let user = createUser(req);
        req.session.uid = user._key;
        req.sessionStorage.save(req.session);
        res.send({_key: user._key, username: user.username});
    })
    .body(User.Signup, 'Complete User Information')
    .response(User.Identity, 'Identifying information')
    .description('Creates a new user and logs them in.');


router
    .get('/whoami', function (req, res) {
        try {
            const user = users.document(req.session.uid);
            res.send({username: user.username, _key: user._key});
        } catch (e) {
            res.send({username: null, _key: null});
        }
    })
    .response(User.Identity, 'Identifying information')
    .description('Returns the currently active username.');


router
    .post('/logout', function (req, res) {
        if (req.session.uid) {
            req.session.uid = null;
            req.sessionStorage.save(req.session);
        }
        res.send({success: true});
    })
    .response(joi.object({success: true}), 'A success message - only true possible')
    .description('Logs the current user out.');