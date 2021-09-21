#!/bin/sh

echo 'Checking migration details...'
yarn prisma migrate status

echo 'Running migrations'
yarn prisma migrate deploy

echo '[Legacy] Running TypeORM migrations...'
if type "typeorm" > /dev/null; then
  yarn typeorm migration:run
fi

echo 'Migrations and schemas should be synced.'
yarn start
