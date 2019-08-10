'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Answer = require('../models/answer');

const answers = module.context.collection('answers');
const keySchema = joi.string().required()
.description('The key of the answer');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('answer');


router.get(function (req, res) {
  res.send(answers.all());
}, 'list')
.response([Answer], 'A list of answers.')
.summary('List all answers')
.description(dd`
  Retrieves a list of all answers.
`);


router.post(function (req, res) {
  const answer = req.body;
  let meta;
  try {
    meta = answers.save(answer);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(answer, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: answer._key})
  ));
  res.send(answer);
}, 'create')
.body(Answer, 'The answer to create.')
.response(201, Answer, 'The created answer.')
.error(HTTP_CONFLICT, 'The answer already exists.')
.summary('Create a new answer')
.description(dd`
  Creates a new answer from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let answer
  try {
    answer = answers.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(answer);
}, 'detail')
.pathParam('key', keySchema)
.response(Answer, 'The answer.')
.summary('Fetch a answer')
.description(dd`
  Retrieves a answer by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const answer = req.body;
  let meta;
  try {
    meta = answers.replace(key, answer);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(answer, meta);
  res.send(answer);
}, 'replace')
.pathParam('key', keySchema)
.body(Answer, 'The data to replace the answer with.')
.response(Answer, 'The new answer.')
.summary('Replace a answer')
.description(dd`
  Replaces an existing answer with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let answer;
  try {
    answers.update(key, patchData);
    answer = answers.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(answer);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the answer with.'))
.response(Answer, 'The updated answer.')
.summary('Update a answer')
.description(dd`
  Patches a answer with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    answers.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a answer')
.description(dd`
  Deletes a answer from the database.
`);
