'use strict';
const _ = require('lodash');
const joi = require('joi');
const p = require('../util/patterns');

const write = {
    name: p.locationname.required(),
    location: p.location.required()
};

const view = {
    _key: p._key.required(),
    name: p.locationname.required(),
    location: p.location.required()
};

const patch = {
    name: p.locationname.optional(),
    location: p.location.optional()
};

function forClient(obj) {
    // Implement outgoing transformations here
    obj = _.pick(obj, ['_key', 'name', 'location']);
    return obj;
}

function fromClient(obj) {
    // Implement incoming transformations here
    obj = _.pick(obj, ['name', 'location']);
    return obj;
}

function wrap(schema) {
    return _.assign({forClient: forClient, fromClient: fromClient}, {schema: schema});
}

module.exports = {
    View: wrap(view),
    Write: wrap(write),
    Patch: wrap(patch)
};
