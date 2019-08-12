'use strict';
const _ = require('lodash');
const joi = require('joi');
const p = require('../util/patterns');

const write = {
  category: p.category.required(),
  fact: p.fact.required()
};

const view = {
  _key: p._key.required(),
  category: p.category.required(),
  fact: p.fact.required()
};

const patch = {
  category: p.category.optional(),
  fact: p.fact.optional()
};

function forClient(obj) {
  // Implement outgoing transformations here
  obj = _.pick(obj, ['_key', 'category', 'fact']);
  return obj;
}

function fromClient(obj) {
  // Implement incoming transformations here
  obj = _.pick(obj, ['category', 'fact']);
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
