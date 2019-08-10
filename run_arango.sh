#!/bin/bash

docker run \
-p 127.0.0.1:8529:8529 \
-e ARANGO_ROOT_PASSWORD=initial1 \
--name arangodb \
-d \
--rm \
-v arangodb_data:/var/lib/arangodb3 \
-v $(pwd)/apps:/var/lib/arangodb3-apps/_db/_system/ \
arangodb
