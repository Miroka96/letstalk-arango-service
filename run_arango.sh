#!/bin/bash

docker run \
-p 127.0.0.1:8529:8529 \
-e ARANGO_ROOT_PASSWORD=initial1 \
--name arangodb \
-d \
-v arangodb_data:/var/lib/arangodb3 \
-v "$(pwd)/service:/var/lib/arangodb3-apps/_db/_system/letstalk/APP" \
arangodb
echo "http://localhost:8529 with root:initial1 and DB=_SYSTEM"

echo "Put ArangoDb service 'letstalk' into development mode (Login -> Services -> letstalk -> Settings -> 'Set Development'"
