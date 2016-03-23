#!/bin/bash

git add -A && git commit -am "updated para-admin-ui" && git push origin master
git checkout gh-pages
git rebase master
#cp -Rf dist/* .
#git add -A && git commit -am "updated para-admin-ui"
git push origin gh-pages
git checkout master
echo "-- done --"
