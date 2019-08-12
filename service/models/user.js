'use strict';
const _ = require('lodash');
const joi = require('joi');
const auth = require('../util/auth');
const p = require('../util/patterns');

const login = {
    username: p.username.required(),
    password: p.password.required()
};

const signup = {
    username: p.username.required(),
    password: p.password.required(),
    firstname: p.firstname.required(),
    lastname: p.lastname.required(),
    birthday: p.birthday.required()
};

const view = {
    _key: p._key.required(),
    firstname: p.firstname.required(),
    lastname: p.lastname.required(),
    username: p.username.required(),
    birthday: p.birthday.required()
};

const patch = {
    username: p.username.optional(),
    password: p.password.optional(),
    firstname: p.firstname.optional(),
    lastname: p.lastname.optional(),
    birthday: p.birthday.optional()
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
    return _.assign({forClient: forClient, fromClient: fromClientEncrypted}, {schema: schema});
}

function wrapPlain(schema) {
    return _.assign({forClient: forClient, fromClient: fromClientPlain()}, {schema: schema});
}

module.exports = {
    Login: wrapPlain(login),
    Signup: wrap(signup),
    View: wrap(view),
    ViewArray: wrap([view]),
    Update: wrap(signup),
    Patch: wrap(patch)
};
