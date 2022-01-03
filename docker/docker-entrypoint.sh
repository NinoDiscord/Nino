#!/bin/bash
java -Xmx4096m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8 -Pwinterfox.dedi="${DEDI_NODE:-"none"}" ./Nino.jar
