'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Membership = require('../models/membership');

const memberOf = module.context.collection('memberOf');
const keySchema = require('../util/patterns')._key.required()
    .description('The key of the membership');

const p = require('../util/perm');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('membership');


router
    .get(p.restrict(p.p.view_memberships), function (req, res) {
        res.send(memberOf.all());
    }, 'list')
    .response([Membership.View], 'A list of memberships.')
    .summary('List all memberships')
    .description(dd`
  Retrieves a list of all memberships.
`);


router
    .get(':key', function (req, res) {
        const key = req.pathParams.key;
        const membershipId = `${memberOf.name()}/${key}`;
        try {
            const membership = memberOf.document(key);
            if (!(p.has(req.user, p.p.view_memberships, membershipId) ||
                p.has(req.user, p.p.view_memberships, membership._from) ||
                p.has(req.user, p.p.view_memberships, membership._to))) {
                res.throw(403, 'Not authorized');
            }
            res.send(membership);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            throw e;
        }
    }, 'detail')
    .pathParam('key', keySchema)
    .response(Membership.View, 'The membership.')
    .summary('Fetch a membership')
    .description(dd`
  Retrieves a membership by its key.
`);


router.delete(':key', function (req, res) {
    const key = req.pathParams.key;
    const membershipId = `${memberOf.name()}/${key}`;

    try {
        const membership = memberOf.document(key);
        if (!(
            p.has(req.user, p.p.delete_membership, membership._to) || // kick user out of group
            p.has(req.user, p.p.delete_membership, membershipId)) // delete own membership
        // user should not always be able to delete membership
        ) {
            res.throw(403, 'Not authorized');
        }
        memberOf.remove(key);
        p.deleteAll(membershipId)
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
    .summary('Remove a membership')
    .description(dd`
  Deletes a membership from the database.
`);
