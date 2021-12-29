#!/bin/bash

echo "Starting up Nino image..."
java -Xmx4096m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8 -Pwinterfox.dedi="${DEDI_NODE}" ./Nino.jar
