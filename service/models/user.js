'use strict';
const _ = require('lodash');
const joi = require('joi');
const auth = require('../util/auth');

const username = joi.string();
const password = joi.string();

const firstname = joi.string();
const lastname = joi.string();
const birthday = joi.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const login = {
    username: username.required(),
    password: password.required()
};

const signup = {
    username: username.required(),
    password: password.required(),
    firstname: firstname.required(),
    lastname: lastname.required(),
    birthday: birthday.required()
};

const view = {
    _key: joi.string().required(),
    firstname: firstname.required(),
    lastname: lastname.required(),
    username: username.required(),
    birthday: birthday.required()
};

const patch = {
    username: username.optional(),
    password: password.optional(),
    firstname: firstname.optional(),
    lastname: lastname.optional(),
    birthday: birthday.optional()
}

function forClient(data) {
    // Implement outgoing transformations here
    return _.pick(data, ['_key', 'username', 'firstname', 'lastname', 'birthday']);
}

function fromClientPlain(data) {
    // Implement incoming transformations here
    return data;
}

function fromClientEncrypted(data) {
    // Implement incoming transformations here
    let obj = _.omit(fromClientPlain(data), ['password']);
    if (data.password) {
        obj.authData = auth.create(data.password);
    }
    return obj;
}

function wrap(schema) {
    return _.assign({}, {forClient: forClient, fromClient: fromClientEncrypted}, {schema: schema});
}

function wrapPlain(schema) {
    return _.assign({}, {forClient: forClient, fromClient: fromClientPlain()}, {schema: schema});
}

module.exports = {
    Login: wrapPlain(login),
    Signup: wrap(signup),
    View: wrap(view),
    ViewArray: wrap([view]),
    Update: wrap(signup),
    Patch: wrap(patch)
};
