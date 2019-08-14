"use strict";
const dd = require('dedent');

const keySchema = require('../util/patterns')._key.required().description('The key of the user');

const status = require('statuses');
const HTTP_CONFLICT = status('conflict');

const createRouter = require('@arangodb/foxx/router');

const router = createRouter();
module.exports = router;

const db = require('@arangodb').db;
const aql = require('@arangodb').aql;
const users = module.context.collection('users');
const Fact = require('../models/fact');
const facts = module.context.collection('facts');
const hasFact = module.context.collection('hasFact');
const p = require('../util/perm');

router
    .get(':key/facts', function (req, res) {
        const key = req.pathParams.key;
        const userId = `${users.name()}/${key}`;
        if (!p.has(req.user, p.p.view_user_facts, userId)) res.throw(403, 'Not authorized');
        const userFacts = db._query(aql`FOR fact IN OUTBOUND ${userId} ${hasFact} RETURN fact`);
        res.send(userFacts);
    }, 'list')
    .pathParam('key', keySchema)
    .response([Fact.View], 'A list of facts.')
    .summary('List all facts of the path user')
    .description(dd`
  Retrieves a list of all facts of the user specified in the path.
`);

router
    .post(':key/facts', function (req, res) {
        const key = req.pathParams.key;
        const id = `${users.name()}/${key}`;
        if (!p.has(req.user, p.p.add_fact, id)) res.throw(403, 'Not authorized');

        const fact = req.body;
        let meta;
        try {
            meta = facts.save(fact);
            hasFact.save({_from: id, _to: meta._id});
            p.grant(id, meta, [p.p.change_fact, p.p.delete_fact]);
        } catch (e) {
            throw e;
        }
        Object.assign(fact, meta);
        res.status(201);
        res.set('location', req.makeAbsolute(
            req.reverse('detail', {key: fact._key})
        ));
        res.send(fact);
    }, 'create')
    .pathParam('key', keySchema)
    .body(Fact.Write, 'The fact to create.')
    .response(201, Fact.View, 'The created fact.')
    .error(HTTP_CONFLICT, 'The fact already exists.')
    .summary('Create a new fact for the path user')
    .description(dd`
  Creates a new fact from the request body and
  returns the saved document.
`);
