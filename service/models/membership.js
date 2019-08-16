'use strict';
const _ = require('lodash');
const joi = require('joi');
const p = require('../util/patterns');

const write = {
    user_key: p._key.required(),
    location_key: p._key.required()
};

const writeOn = {
    user_key: p._key.optional()
};

const view = {
    _key: p._key.required(),
    user_key: p._key.required(),
    location_key: p._key.required()
};

function forClient(obj) {
    // Implement outgoing transformations here
    obj = _.pick(obj, ['_key', 'user_key', 'location_key']);
    return obj;
}

function fromClient(obj) {
    // Implement incoming transformations here
    obj = _.pick(obj, ['user_key', 'location_key']);
    return obj;
}

function wrap(schema) {
    return _.assign({forClient: forClient, fromClient: fromClient}, {schema: schema});
}

module.exports = {
    View: wrap(view),
    Write: wrap(write),
    WriteOn: wrap(writeOn)
};
