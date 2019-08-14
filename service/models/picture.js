'use strict';
const _ = require('lodash');
const joi = require('joi');
const p = require('../util/patterns');

const write = {
    data: p.data.required()
};

const view = {
    _key: p._key.required(),
    data: p.data.required()
};

const patch = {
    data: p.data.optional()
};

function forClient(obj) {
    // Implement outgoing transformations here
    obj = _.pick(obj, ['_key', 'data']);
    return obj;
}

function fromClient(obj) {
    // Implement incoming transformations here
    obj = _.pick(obj, ['data']);
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
