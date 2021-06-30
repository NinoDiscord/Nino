#!/bin/bash

echo 'Running migrations'
typeorm migration:run

echo 'Migrations and schemas should be synced.'
npm start
