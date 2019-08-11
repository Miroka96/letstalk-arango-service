'use strict';

const users = module.context.collection('users');

const P = require('../util/permissions');
const perms = module.context.collection('hasPermission');

const httpError = require('http-errors');
const status = require('statuses');
const HTTP_CONFLICT = status('conflict');
const errors = require('@arangodb').errors;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;

module.exports = function (req) {
    const user = req.body;
    user.perms = [P.view_user];
    let meta;
    try {
        meta = users.save(user);
    } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
            throw httpError(HTTP_CONFLICT, "Username already taken");
        }
        throw e;
    }
    Object.assign(user, meta);
    perms.save({_from: user._id, _to: user._id, name: P.change_user});
    perms.save({_from: user._id, _to: user._id, name: P.delete_user});
    return user;
};