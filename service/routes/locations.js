'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Location = require('../models/location');

const locations = module.context.collection('locations');
const keySchema = require('../util/patterns')._key.required()
    .description('The key of the location');

const p = require('../util/perm');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('location');


router
    .get(p.restrict(p.p.view_locations), function (req, res) {
        res.send(locations.all());
    }, 'list')
    .response([Location.View], 'A list of locations.')
    .summary('List all locations')
    .description(dd`
  Retrieves a list of all locations.
`);


router
    .post(p.restrict(p.p.add_location), function (req, res) {
        const location = req.body;
        let meta;

        meta = locations.save(location);

        Object.assign(location, meta);
        res.status(201);
        res.set('location', req.makeAbsolute(
            req.reverse('detail', {key: location._key})
        ));
        res.send(location);
    }, 'create')
    .body(Location.Write, 'The location to create.')
    .response(201, Location.View, 'The created location.')
    .summary('Create a new location')
    .description(dd`
  Creates a new location from the request body and
  returns the saved document.
`);


router
    .get(':key', function (req, res) {
        const key = req.pathParams.key;
        const id = `${locations.name()}/${key}`;
        if (!p.has(req.user, p.p.view_location, id)) res.throw(403, 'Not authorized');
        let location;
        try {
            location = locations.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            throw e;
        }
        res.send(location);
    }, 'detail')
    .pathParam('key', keySchema)
    .response(Location.View, 'The location.')
    .summary('Fetch a location')
    .description(dd`
  Retrieves a location by its key.
`);


router
    .put(':key', function (req, res) {
        const key = req.pathParams.key;
        const id = `${locations.name()}/${key}`;
        if (!p.has(req.user, p.p.change_location, id)) res.throw(403, 'Not authorized');
        const location = req.body;
        let meta;
        try {
            meta = locations.replace(key, location);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        Object.assign(location, meta);
        res.send(location);
    }, 'replace')
    .pathParam('key', keySchema)
    .body(Location.Write, 'The data to replace the location with.')
    .response(Location.View, 'The new location.')
    .summary('Replace a location')
    .description(dd`
  Replaces an existing location with the request body and
  returns the new document.
`);


router
    .patch(':key', function (req, res) {
        const key = req.pathParams.key;
        const id = `${locations.name()}/${key}`;
        if (!p.has(req.user, p.p.change_location, id)) res.throw(403, 'Not authorized');
        const patchData = req.body;
        let location;
        try {
            locations.update(key, patchData);
            location = locations.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        res.send(location);
    }, 'update')
    .pathParam('key', keySchema)
    .body(Location.Patch, 'The data to update the location with.')
    .response(Location.View, 'The updated location.')
    .summary('Update a location')
    .description(dd`
  Patches a location with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
    const key = req.pathParams.key;
    const id = `${locations.name()}/${key}`;
    if (!p.has(req.user, p.p.delete_location, id)) res.throw(403, 'Not authorized');
    try {
        locations.remove(key);
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
    .summary('Remove a location')
    .description(dd`
  Deletes a location from the database.
`);

router.use(require('./locations_questions'));
router.use(require('./_pictures').locations);
