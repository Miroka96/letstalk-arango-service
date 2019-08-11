'use strict';
const _ = require('lodash');
const joi = require('joi');

module.exports = {
  schema: {
    // Describe the attributes with joi here
    _key: joi.number(),
    name: joi.string().required(),
    location: joi.string(),
    owners: joi.array(joi.number()).required(),
    questions: joi.array(joi.number()).required(),
    answers: joi.array(joi.number()).required(),
    members: joi.array(joi.number()).required(),
    pictures: joi.array(joi.number()).required()
  },
  forClient(obj) {
    // Implement outgoing transformations here
    obj = _.omit(obj, ['_id', '_rev', '_oldRev']);
    return obj;
  },
  fromClient(obj) {
    // Implement incoming transformations here
    obj = _.omit(obj, ['_key']);
    _.merge(obj, {owners:[], questions:[], answers:[], members:[], pictures:[]});
    return obj;
  }
};
