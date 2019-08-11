'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Picture = require('../models/picture');

const pictures = module.context.collection('pictures');
const keySchema = joi.string().required()
.description('The key of the picture');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('picture');


router.get(function (req, res) {
  res.send(pictures.all());
}, 'list')
.response([Picture], 'A list of pictures.')
.summary('List all pictures')
.description(dd`
  Retrieves a list of all pictures.
`);


router.post(function (req, res) {
  const picture = req.body;
  let meta;
  try {
    meta = pictures.save(picture);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(picture, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: picture._key})
  ));
  res.send(picture);
}, 'create')
.body(Picture, 'The picture to create.')
.response(201, Picture, 'The created picture.')
.error(HTTP_CONFLICT, 'The picture already exists.')
.summary('Create a new picture')
.description(dd`
  Creates a new picture from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let picture
  try {
    picture = pictures.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(picture);
}, 'detail')
.pathParam('key', keySchema)
.response(Picture, 'The picture.')
.summary('Fetch a picture')
.description(dd`
  Retrieves a picture by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const picture = req.body;
  let meta;
  try {
    meta = pictures.replace(key, picture);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(picture, meta);
  res.send(picture);
}, 'replace')
.pathParam('key', keySchema)
.body(Picture, 'The data to replace the picture with.')
.response(Picture, 'The new picture.')
.summary('Replace a picture')
.description(dd`
  Replaces an existing picture with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let picture;
  try {
    pictures.update(key, patchData);
    picture = pictures.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(picture);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the picture with.'))
.response(Picture, 'The updated picture.')
.summary('Update a picture')
.description(dd`
  Patches a picture with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    pictures.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a picture')
.description(dd`
  Deletes a picture from the database.
`);
