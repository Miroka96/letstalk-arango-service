'use strict';
const hasPerm = require('./hasPerm');

// returns a middleware that checks user permission for 'name'
module.exports = function (name) {
    return function (req, res, next) {
        if (!hasPerm(req.user, name)) res.throw(403, 'Not authorized');
        next();
    };
};