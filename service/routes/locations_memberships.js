"use strict";
const dd = require('dedent');
const joi = require('joi');
const _ = require('lodash');

const keySchema = require('../util/patterns')._key.required().description('The key of the location');

const status = require('statuses');
const HTTP_CONFLICT = status('conflict');

const createRouter = require('@arangodb/foxx/router');

const router = createRouter();
module.exports = router;

const db = require('@arangodb').db;
const aql = require('@arangodb').aql;
const locations = module.context.collection('locations');
const Membership = require('../models/membership');
const users = module.context.collection('users');
const memberOf = module.context.collection('memberOf');
const p = require('../util/perm');

router
    .get(':key/memberships', function (req, res) {
        const key = req.pathParams.key;
        const locationId = `${locations.name()}/${key}`;
        if (!p.has(req.user, p.p.view_memberships, locationId)) res.throw(403, 'Not authorized');
        const memberships = memberOf.inEdges(locationId);
        res.send(memberships);
    }, 'list')
    .pathParam('key', keySchema)
    .response([Membership.View], 'A list of memberships.')
    .summary('List all memberships having the path location')
    .description(dd`
  Retrieves a list of all memberships having the location specified in the path.
`);

router
    .post(':key/memberships', function (req, res) {
        if (!req.user) {
            res.throw(401, 'Unauthorized');
        }
        const addingUserId = req.user._id;

        const locationKey = req.pathParams.key;
        const locationId = `${locations.name()}/${locationKey}`;

        let userKey = req.body.user_key;
        if (!userKey) userKey = req.user._key;
        const userId = `${users.name()}/${userKey}`;

        if (!p.has(addingUserId, p.p.add_membership, locationId)) res.throw(403, 'Not authorized');
            const membership = {_from: userId, _to: locationId, user_key: userKey, location_key: locationKey};
        let meta;
        try {
            meta = memberOf.save(membership);
        } catch (e) {
            throw e;
        }
        _.assign(membership, meta);
        res.status(201);
        res.send(membership);
    }, 'join')
    .pathParam('key', keySchema)
    .body(Membership.WriteOn, 'The membership to create.')
    .response(201, Membership.View, 'The created membership.')
    .error(HTTP_CONFLICT, 'The user already joined.')
    .summary('Join the current user to the path location')
    .description(dd`
  Join the current user to the path location and return a success message.
`);
