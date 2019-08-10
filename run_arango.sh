#!/bin/bash

mkdir -p ./apps

docker run \
-p 127.0.0.1:8529:8529 \
-e ARANGO_ROOT_PASSWORD=initial1 \
--name arangodb \
-d \
--rm \
-v arangodb_data:/var/lib/arangodb3 \
-v $(pwd)/apps:/var/lib/arangodb3-apps/_db/_system/ \
arangodb

rm -f service.zip

cd service
zip -r ../service.zip *

echo "Login at http://localhost:8529 as root with password initial1"
echo "As database choose _SYSTEM"
echo "Import the created service.zip as service into the database (SERVICES -> Add -> Upload -> drop ZIP -> Install -> mountpoint = /dev)"
echo "Enable Development mode for the service 'dev' (SERVICES -> dev -> Settings -> 'Set Development')"
echo "finally run 'sudo chmod -R 777 apps/dev'"
