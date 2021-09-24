#!/bin/sh

echo 'Checking migration details...'
yarn prisma migrate status

echo 'Running migrations'
yarn prisma migrate deploy

echo 'Migrations and schemas should be synced.'
yarn start
