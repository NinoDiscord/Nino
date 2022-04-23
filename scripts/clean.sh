#!/bin/bash

echo "[::clean] Cleaning \`build\` directories..."

rm -rf build
rm -rf {bot,api,automod,commands,database,commons,core,database,modules}/build
rm -rf modules/{localisation,metrics,punishments,ravy,scripting,timeouts}/build
rm -rf commands/{legacy,slash}/build

echo "[::clean] Done!"
