#!/bin/bash

docker run \
-p 127.0.0.1:8529:8529 \
-e ARANGO_ROOT_PASSWORD=initial1 \
--name arangodb \
-d \
-v arangodb_data:/var/lib/arangodb3 \
-v "$(pwd)/service:/var/lib/arangodb3-apps/_db/_system/letstalk/APP" \
arangodb
echo "http://root:initial1@localhost:8529 DB=_SYSTEM"

echo "Put ArangoDb service 'dev' into development mode (Login -> Services -> dev -> Settings -> 'Set Development'"
