#!/usr/bin/env bash

set -e

IP=$(node ip.js)
echo "IP=$IP"

export LOCAL_UPDATE_CENTER=http://$IP:3000

echo "=> Starting Service..."
node index.js &
SERVICE_PID=$!

function cleanup {
  kill $SERVICE_PID
}
trap cleanup EXIT

echo
echo "=> Build Jenkins docker image with three plugins"
export BUILDKIT_PROGRESS=plain
docker build --no-cache --build-arg LOCAL_IP=$IP integration


echo
echo "=> Should find three files in cache"
JSONFILES=$(find cache -name "*.json" | wc -l | xargs)
if [[ $JSONFILES -eq 3 ]]; then
    echo "OK"
else
    echo "Should find 3 *.json files in cache but found $JSONFILES: "
    find cache -name "*.json"
    exit 1
fi
