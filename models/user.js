'use strict';
const _ = require('lodash');
const joi = require('joi');

module.exports = {
  schema: {
    // Describe the attributes with joi here
    firstname: joi.string(),
    lastname: joi.string(),
    username: joi.string(),
    password_sha: joi.string(),
    birthday: joi.string()
  },
  forClient(obj) {
    // Implement outgoing transformations here
    obj = _.omit(obj, ['password_sha', '_rev', '_oldRev']);
    return obj;
  },
  fromClient(obj) {
    // Implement incoming transformations here
    return obj;
  }
};
