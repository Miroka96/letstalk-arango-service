#!/bin/bash
echo "start arango db using run_arango.sh script"
echo "Press ENTER to continue"
read

mkdir -p ./apps

rm -f app.zip

cd APP
zip -r ../app.zip *
cd ..

echo "Login at http://localhost:8529 as root with password initial1"
echo "As database choose _SYSTEM"
echo "Import the created app.zip as service into the database (SERVICES -> Add -> Upload -> drop ZIP -> Install -> mountpoint = /dev)"
echo "Enable Development mode for the service 'dev' (SERVICES -> dev -> Settings -> 'Set Development')"
echo "Done?"
echo "Press ENTER"
read

sudo rm -r apps/dev
git clone $(git remote get-url origin) apps/dev
sudo chmod -R 777 apps/dev
echo "Now point your IDE to $(pwd)/apps/dev/APP/"
