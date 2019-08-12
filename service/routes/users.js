'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const User = require('../models/user');

const createUser = require('../util/createUser');

const users = module.context.collection('users');
const keySchema = require('../util/patterns')._key.required()
    .description('The key of the user');

const p = require('../util/perm');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;

router.tag('user');


router.get(p.restrict(p.p.view_users), function (req, res) {
    res.send(users.all());
}, 'list')
    .response([User.ViewArray], 'A list of users.')
    .summary('List all users')
    .description(dd`
  Retrieves a list of all users.
`);


router.post(p.restrict(p.p.add_user), function (req, res) {
    let user = createUser(req);
    res.status(201);
    res.set('location', req.makeAbsolute(
        req.reverse('detail', {key: user._key})
    ));
    res.send(user);
}, 'create')
    .body(User.Signup, 'The user to create.')
    .response(201, User.View, 'The created user.')
    .error(HTTP_CONFLICT, 'The user already exists.')
    .summary('Create a new user')
    .description(dd`
  Creates a new user from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
    const key = req.pathParams.key;
    const id = `${users.name()}/${key}`;
    if (!p.has(req.user, p.p.view_user, id)) res.throw(403, 'Not authorized');
    let user;
    try {
        user = users.document(key);
    } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
            throw httpError(HTTP_NOT_FOUND, e.message);
        }
        throw e;
    }
    res.send(user);
}, 'detail')
    .pathParam('key', keySchema)
    .response(User.View, 'The user.')
    .summary('Fetch a user')
    .description(dd`
  Retrieves a user by its key.
`);


router.put(':key', function (req, res) {
    const key = req.pathParams.key;
    const id = `${users.name()}/${key}`;
    if (!p.has(req.user, p.p.change_user, id)) res.throw(403, 'Not authorized');
    const user = req.body;
    let meta;
    try {
        meta = users.replace(key, user);
    } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
            throw httpError(HTTP_NOT_FOUND, e.message);
        }
        if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
            throw httpError(HTTP_CONFLICT, e.message);
        }
        throw e;
    }
    Object.assign(user, meta);
    res.send(user);
}, 'replace')
    .pathParam('key', keySchema)
    .body(User.Update, 'The data to replace the user with.')
    .response(User.View, 'The new user.')
    .summary('Replace a user')
    .description(dd`
  Replaces an existing user with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
    const key = req.pathParams.key;
    const id = `${users.name()}/${key}`;
    if (!p.has(req.user, p.p.change_user, id)) res.throw(403, 'Not authorized');
    const patchData = req.body;
    let user;
    try {
        users.update(key, patchData);
        user = users.document(key);
    } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
            throw httpError(HTTP_NOT_FOUND, e.message);
        }
        if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
            throw httpError(HTTP_CONFLICT, e.message);
        }
        if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
            throw httpError(HTTP_CONFLICT, e.message);
        }
        throw e;
    }
    res.send(user);
}, 'update')
    .pathParam('key', keySchema)
    .body(User.Patch, 'The data to update the user with.')
    .response(User.View, 'The updated user.')
    .summary('Update a user')
    .description(dd`
  Patches a user with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
    const key = req.pathParams.key;
    const id = `${users.name()}/${key}`;
    if (!p.has(req.user, p.p.delete_user, id)) res.throw(403, 'Not authorized');
    try {
        users.remove(key);
        for (const perm of perms.inEdges(id)) {
            perms.remove(perm);
        }
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
    .summary('Remove a user')
    .description(dd`
  Deletes a user from the database.
`);


router.use(require('./users_facts'));
router.use(require('./users_topics'));

