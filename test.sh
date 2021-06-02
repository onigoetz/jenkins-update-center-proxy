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
docker build --no-cache --build-arg LOCAL_IP=$IP integration


echo
echo "=> Should find three files in cache"
HPIFILES=$(find cache -name "*.hpi" | wc -l | xargs)
if [[ $HPIFILES -eq 3 ]]; then
    echo "OK"
else
    echo "Should find 3 *.hpi files in cache but found $HPIFILES: "
    find cache -name "*.hpi"
    exit 1
fi

echo
echo "=> Files in cache should be valid zip files"
find cache -name "*.hpi" -print0 | xargs -0 -n1 unzip -t

echo "OK"
