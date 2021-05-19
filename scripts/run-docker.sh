#!/bin/bash

echo 'Running migrations & syncing schema...'
typeorm migration:run
typeorm schema:sync

echo 'Migrations and schemas should be synced.'
npm start
