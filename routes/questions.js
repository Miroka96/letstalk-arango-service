'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Question = require('../models/question');

const questions = module.context.collection('questions');
const keySchema = joi.string().required()
.description('The key of the question');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('question');


router.get(function (req, res) {
  res.send(questions.all());
}, 'list')
.response([Question], 'A list of questions.')
.summary('List all questions')
.description(dd`
  Retrieves a list of all questions.
`);


router.post(function (req, res) {
  const question = req.body;
  let meta;
  try {
    meta = questions.save(question);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(question, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: question._key})
  ));
  res.send(question);
}, 'create')
.body(Question, 'The question to create.')
.response(201, Question, 'The created question.')
.error(HTTP_CONFLICT, 'The question already exists.')
.summary('Create a new question')
.description(dd`
  Creates a new question from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let question
  try {
    question = questions.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(question);
}, 'detail')
.pathParam('key', keySchema)
.response(Question, 'The question.')
.summary('Fetch a question')
.description(dd`
  Retrieves a question by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const question = req.body;
  let meta;
  try {
    meta = questions.replace(key, question);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(question, meta);
  res.send(question);
}, 'replace')
.pathParam('key', keySchema)
.body(Question, 'The data to replace the question with.')
.response(Question, 'The new question.')
.summary('Replace a question')
.description(dd`
  Replaces an existing question with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let question;
  try {
    questions.update(key, patchData);
    question = questions.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(question);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the question with.'))
.response(Question, 'The updated question.')
.summary('Update a question')
.description(dd`
  Patches a question with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    questions.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a question')
.description(dd`
  Deletes a question from the database.
`);
