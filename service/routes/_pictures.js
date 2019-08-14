"use strict";
const dd = require('dedent');

const keySchema = require('../util/patterns')._key.required().description('The key of the location');

const status = require('statuses');
const HTTP_CONFLICT = status('conflict');

const createRouter = require('@arangodb/foxx/router');

const urouter = createRouter();
const lrouter = createRouter();

module.exports = {
    users: urouter,
    locations: lrouter
};

const db = require('@arangodb').db;
const aql = require('@arangodb').aql;
const locations = module.context.collection('locations');
const users = module.context.collection('users');
const Picture = require('../models/picture');
const pictures = module.context.collection('pictures');
const hasPicture = module.context.collection('hasPicture');
const p = require('../util/perm');

function create(router, keyCollection, collectionName) {
    router
        .get(':key/pictures', function (req, res) {
            const key = req.pathParams.key;
            const id = `${keyCollection.name()}/${key}`;
            if (!p.has(req.user, p.p.view_pictures, id)) res.throw(403, 'Not authorized');
            const pictures = db._query(aql`FOR picture IN OUTBOUND ${id} ${hasPicture} RETURN picture`);
            res.send(pictures);
        }, 'list')
        .pathParam('key', keySchema)
        .response([Picture.View], 'A list of pictures.')
        .summary(`List all pictures of the path ${collectionName}`)
        .description(dd`
  Retrieves a list of all pictures of the ${collectionName} specified in the path.
`);

    router
        .post(':key/pictures', function (req, res) {
            const key = req.pathParams.key;
            const id = `${keyCollection.name()}/${key}`;
            if (!p.has(req.user, p.p.add_picture, id)) res.throw(403, 'Not authorized');

            const picture = req.body;
            let meta;
            try {
                meta = pictures.save(picture);
                hasPicture.save({_from: id, _to: meta._id});
                p.grant(req.user, meta, [p.p.change_picture, p.p.delete_picture]);
            } catch (e) {
                throw e;
            }
            Object.assign(picture, meta);
            res.status(201);
            res.set('location', req.makeAbsolute(
                req.reverse('detail', {key: picture._key})
            ));
            res.send(picture);
        }, 'create')
        .pathParam('key', keySchema)
        .body(Picture.Write, 'The picture to create.')
        .response(201, Picture.View, 'The created picture.')
        .error(HTTP_CONFLICT, 'The picture already exists.')
        .summary(`Create a new picture for the path ${collectionName}`)
        .description(dd`
  Creates a new picture from the request body and
  returns the saved document.
`);

}

create(urouter, users, 'user');
create(lrouter, locations, 'location')
