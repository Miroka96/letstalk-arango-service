'use strict';

const users = module.context.collection('users');

const p = require('./perm');

const httpError = require('http-errors');
const status = require('statuses');
const HTTP_CONFLICT = status('conflict');
const errors = require('@arangodb').errors;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;

module.exports = function (req) {
    const user = req.body;
    user.perms = [
        p.p.view_user,
        p.p.add_location,
        p.p.view_locations,
        p.p.join_location
    ];
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

    p.grant(user, user, [
        p.p.view_user,
        p.p.change_user,
        p.p.delete_user,
        p.p.add_fact,
        p.p.add_topic,
        p.p.add_picture
    ]);
    return user;
};