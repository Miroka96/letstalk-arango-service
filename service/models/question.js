'use strict';
const _ = require('lodash');
const joi = require('joi');
const p = require('../util/patterns');

const write = {
  question: p.question.required(),
  options: p.questionoptions.required()
};

const view = {
  _key: p._key.required(),
  question: p.question.required(),
  options: p.questionoptions.required()
};

const patch = {
  question: p.question.optional(),
  options: p.questionoptions.optional()
};

function forClient(obj) {
  // Implement outgoing transformations here
  obj = _.pick(obj, ['_key', 'question', 'questionoptions']);
  return obj;
}

function fromClient(obj) {
  // Implement incoming transformations here
  obj = _.pick(obj, ['question', 'questionoptions']);
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
