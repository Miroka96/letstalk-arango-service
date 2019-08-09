'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Fact = require('../models/fact');

const facts = module.context.collection('facts');
const keySchema = joi.string().required()
.description('The key of the fact');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('fact');


router.get(function (req, res) {
  res.send(facts.all());
}, 'list')
.response([Fact], 'A list of facts.')
.summary('List all facts')
.description(dd`
  Retrieves a list of all facts.
`);


router.post(function (req, res) {
  const fact = req.body;
  let meta;
  try {
    meta = facts.save(fact);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(fact, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: fact._key})
  ));
  res.send(fact);
}, 'create')
.body(Fact, 'The fact to create.')
.response(201, Fact, 'The created fact.')
.error(HTTP_CONFLICT, 'The fact already exists.')
.summary('Create a new fact')
.description(dd`
  Creates a new fact from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let fact
  try {
    fact = facts.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(fact);
}, 'detail')
.pathParam('key', keySchema)
.response(Fact, 'The fact.')
.summary('Fetch a fact')
.description(dd`
  Retrieves a fact by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const fact = req.body;
  let meta;
  try {
    meta = facts.replace(key, fact);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(fact, meta);
  res.send(fact);
}, 'replace')
.pathParam('key', keySchema)
.body(Fact, 'The data to replace the fact with.')
.response(Fact, 'The new fact.')
.summary('Replace a fact')
.description(dd`
  Replaces an existing fact with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let fact;
  try {
    facts.update(key, patchData);
    fact = facts.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(fact);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the fact with.'))
.response(Fact, 'The updated fact.')
.summary('Update a fact')
.description(dd`
  Patches a fact with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    facts.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a fact')
.description(dd`
  Deletes a fact from the database.
`);
