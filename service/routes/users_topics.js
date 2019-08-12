"use strict";
const dd = require('dedent');
const p = require('../util/perm');

const keySchema = require('../util/patterns')._key.required().description('The key of the user');

const status = require('statuses');
const HTTP_CONFLICT = status('conflict');

const createRouter = require('@arangodb/foxx/router');
const router = createRouter();
module.exports = router;

const db = require('@arangodb').db;
const aql = require('@arangodb').aql;
const users = module.context.collection('users');
const Topic = require('../models/topic');
const topics = module.context.collection('topics');
const hasTopic = module.context.collection('hasTopic');

router
    .get(':key/topics', function (req, res) {
        const key = req.pathParams.key;
        const userId = `${users.name()}/${key}`;
        const userTopics = db._query(aql`FOR topic IN OUTBOUND ${userId} ${hasTopic} RETURN topic`);
        res.send(userTopics);
    }, 'list')
    .pathParam('key', keySchema)
    .response([Topic.View], 'A list of topics.')
    .summary('List all topics of the path user')
    .description(dd`
  Retrieves a list of all topics of the user specified in the path.
`);

router
    .post(':key/topics', function (req, res) {
        const key = req.pathParams.key;
        const id = `${users.name()}/${key}`;
        if (!p.has(req.user, p.p.add_topic, id)) res.throw(403, 'Not authorized');

        const topic = req.body;
        let meta;
        try {
            meta = topics.save(topic);
            hasTopic.save({_from: id, _to: meta._id});
            p.grant(id, meta, [p.p.change_topic, p.p.delete_topic]);
        } catch (e) {
            throw e;
        }
        Object.assign(topic, meta);
        res.status(201);
        res.set('location', req.makeAbsolute(
            req.reverse('detail', {key: topic._key})
        ));
        res.send(topic);
    }, 'create')
    .pathParam('key', keySchema)
    .body(Topic.Write, 'The topic to create.')
    .response(201, Topic.View, 'The created topic.')
    .error(HTTP_CONFLICT, 'The topic already exists.')
    .summary('Create a new topic for the path user')
    .description(dd`
  Creates a new topic from the request body and
  returns the saved document.
`);
