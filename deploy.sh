#!/bin/bash

git commit -am "updated para-admin-ui" && git checkout gh-pages
#cp -Rf dist/* .
git add -A && git commit -am "updated para-admin-ui"
git push origin gh-pages
git checkout master
git push origin master
echo "-- done --"
