'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Topic = require('../models/topic');

const topics = module.context.collection('topics');
const keySchema = joi.string().required()
.description('The key of the topic');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('topic');


router.get(function (req, res) {
  res.send(topics.all());
}, 'list')
.response([Topic], 'A list of topics.')
.summary('List all topics')
.description(dd`
  Retrieves a list of all topics.
`);


router.post(function (req, res) {
  const topic = req.body;
  let meta;
  try {
    meta = topics.save(topic);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(topic, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: topic._key})
  ));
  res.send(topic);
}, 'create')
.body(Topic, 'The topic to create.')
.response(201, Topic, 'The created topic.')
.error(HTTP_CONFLICT, 'The topic already exists.')
.summary('Create a new topic')
.description(dd`
  Creates a new topic from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let topic
  try {
    topic = topics.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(topic);
}, 'detail')
.pathParam('key', keySchema)
.response(Topic, 'The topic.')
.summary('Fetch a topic')
.description(dd`
  Retrieves a topic by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const topic = req.body;
  let meta;
  try {
    meta = topics.replace(key, topic);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(topic, meta);
  res.send(topic);
}, 'replace')
.pathParam('key', keySchema)
.body(Topic, 'The data to replace the topic with.')
.response(Topic, 'The new topic.')
.summary('Replace a topic')
.description(dd`
  Replaces an existing topic with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let topic;
  try {
    topics.update(key, patchData);
    topic = topics.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(topic);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the topic with.'))
.response(Topic, 'The updated topic.')
.summary('Update a topic')
.description(dd`
  Patches a topic with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    topics.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a topic')
.description(dd`
  Deletes a topic from the database.
`);
