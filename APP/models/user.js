'use strict';
const _ = require('lodash');
const joi = require('joi');

module.exports = {
  schema: {
    // Describe the attributes with joi here
    _key: joi.string(),
    firstname: joi.string().required(),
    lastname: joi.string().required(),
    username: joi.string().required(),
    password: joi.string().required(),
    birthday: joi.string().required(),
    facts: joi.array().items(joi.number().required()),
    topics: joi.array().items(joi.number().required()),
    locations: joi.array().items(joi.number().required()),
    pictures: joi.array().items(joi.number().required())
  },
  forClient(obj) {
    // Implement outgoing transformations here
    obj = _.omit(obj, ['password', '_rev', '_oldRev', '_id']);
    return obj;
  },
  fromClient(obj) {
    // Implement incoming transformations here
    return obj;
  }
};
