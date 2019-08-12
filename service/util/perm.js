'use strict';

const _ = require('lodash');

const db = require('@arangodb').db;
const aql = require('@arangodb').aql;

const perms = module.context.collection('hasPermission');

const permissions = {
    view_answers: 'view_answers',
    add_answer: 'add_answer',
    view_answer: 'view_answer',
    change_answer: 'change_answer',
    delete_answer: 'delete_answer',

    view_facts: 'view_facts',
    add_fact: 'add_fact',
    view_fact: 'view_fact',
    change_fact: 'change_fact',
    delete_fact: 'delete_fact',

    view_locations: 'view_locations',
    join_location: 'join_location',
    add_location: 'add_location',
    view_location: 'view_location',
    change_location: 'change_location',
    delete_location: 'delete_location',

    view_pictures: 'view_pictures',
    add_picture: 'add_picture',
    view_picture: 'view_picture',
    change_picture: 'change_picture',
    delete_picture: 'delete_picture',

    view_questions: 'view_questions',
    add_question: 'add_question',
    view_question: 'view_question',
    change_question: 'change_question',
    delete_question: 'delete_question',

    view_topics: 'view_topics',
    add_topic: 'add_topic',
    view_topic: 'view_topic',
    change_topic: 'change_topic',
    delete_topic: 'delete_topic',

    view_users: 'view_users',
    add_user: 'add_user',
    view_user: 'view_user',
    change_user: 'change_user',
    delete_user: 'delete_user'
};

function has(user, name, objectId) {
    // DEVELOPMENT
    return true;

    if (!user) return false;
    if (!name) return false;
    if (user.perms.includes(name)) return true;
    if (objectId && hasPerm.firstExample({
        _from: user._id,
        _to: objectId,
        name
    })) return true;
    /*
    const groupHasPerm = db._query(aql`
    FOR group IN 1..100 OUTBOUND ${user._id} ${memberOf}
    FILTER ${name} IN group.perms
    LIMIT 1
    RETURN true
  `).next() || false;
    if (groupHasPerm || !objectId) return groupHasPerm;
    return db._query(aql`
    LET groupIds = (
      FOR group IN 1..100 OUTBOUND ${user._id} ${memberOf}
      RETURN group._id
    )
    FOR perm IN ${hasPerm}
    FILTER perm.name == ${name}
    && perm._from IN groupIds
    && perm._to == ${objectId}
    LIMIT 1
    RETURN true
  `).next() || false;
     */
    return false;
}

function restrict(name) {
    return function (req, res, next) {
        if (!has(req.user, name)) res.throw(403, 'Not authorized');
        next();
    };
}

function grant(user, object, operations) {
    const userId = (_.isObjectLike(user) && '_id' in user) ? user._id : user;
    const objectId = (_.isObjectLike(object) && '_id' in object) ? object._id : object;

    if (!Array.isArray(operations)) {
        operations = [operations];
    }
    for (const operation of operations) {
        perms.save({_from: userId, _to: objectId, name: operation});
    }
}

function deleteAll(object) {
    const objectId = (_.isObjectLike(object) && '_id' in object) ? object._id : object;
    for (const perm of perms.inEdges(objectId)) {
        perms.remove(perm);
    }
}

module.exports = {
    restrict,
    p: permissions,
    has,
    coll: perms,
    grant,
    deleteAll
};
