#!/bin/bash

typeorm migration:run
typeorm schema:sync
