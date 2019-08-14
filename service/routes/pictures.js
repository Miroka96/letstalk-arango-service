'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Picture = require('../models/picture');

const pictures = module.context.collection('pictures');
const hasPicture = module.context.collection('hasPicture');
const keySchema = require('../util/patterns')._key.required()
    .description('The key of the picture');

const p = require('../util/perm');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('picture');


router
    .get(p.restrict(p.p.view_pictures), function (req, res) {
        res.send(pictures.all());
    }, 'list')
    .response([Picture.View], 'A list of pictures.')
    .summary('List all pictures')
    .description(dd`
  Retrieves a list of all pictures.
`);


router
    .get(':key', function (req, res) {
        const key = req.pathParams.key;
        const id = `${pictures.name()}/${key}`;
        if (!p.has(req.user, p.p.view_picture, id)) res.throw(403, 'Not authorized');
        let picture;
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
    .response(Picture.View, 'The picture.')
    .summary('Fetch a picture')
    .description(dd`
  Retrieves a picture by its key.
`);

/*
router
    .put(':key', function (req, res) {
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
 */

/*
router
    .patch(':key', function (req, res) {
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
*/

router
    .delete(':key', function (req, res) {
        const key = req.pathParams.key;
        const id = `${pictures.name()}/${key}`;
        if (!p.has(req.user, p.p.delete_picture, id)) res.throw(403, 'Not authorized');
        try {
            pictures.remove(key);
            for (const has of hasPicture.inEdges(id)) {
                hasPicture.remove(has);
            }
            p.deleteAll(id)
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            throw e;
        }
        res.send({success: true});
    }, 'delete')
    .pathParam('key', keySchema)
    .response(joi.object({success: true}), 'A success message - only true possible')
    .summary('Remove a picture')
    .description(dd`
  Deletes a picture from the database.
`);
