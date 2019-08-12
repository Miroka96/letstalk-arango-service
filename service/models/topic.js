'use strict';
const _ = require('lodash');
const joi = require('joi');
const p = require('../util/patterns');

const write = {
    topic: p.topic.required(),
    interestlevel: p.interestlevel.required()
};

const view = {
    _key: p._key.required(),
    topic: p.topic.required(),
    interestlevel: p.interestlevel.required()
};

const patch = {
    topic: p.topic.optional(),
    interestlevel: p.interestlevel.optional()
};

function forClient(obj) {
    // Implement outgoing transformations here
    obj = _.pick(obj, ['_key', 'topic', 'interestlevel']);
    return obj;
}

function fromClient(obj) {
    // Implement incoming transformations here
    obj = _.pick(obj, ['topic', 'interestlevel']);
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
