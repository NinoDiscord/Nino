#!/bin/bash

# Copyright (c) 2019-2022 Nino
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

set -o errexit
set -o nounset
set -o pipefail

. /app/noelware/nino/scripts/liblog.sh

info "*** Starting Nino! ***"
debug "  => Custom Logback Location: ${NINO_CUSTOM_LOGBACK_FILE:-unknown}"
debug "  => Using Custom Gateway:    ${NINO_USE_GATEWAY:-false}"
debug "  => Dedicated Node:          ${WINTERFOX_DEDI_NODE:-none}"

JAVA_OPTS=("-XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8")

if [[ -z "${NINO_CUSTOM_LOGBACK_FILE:-}" ]]
  JAVA_OPTS+=("-Dlogback.configurationFile=${NINO_CUSTOM_LOGBACK_FILE} ")

if [[ -z "${WINTERFOX_DEDI_NODE:-}" ]]
  JAVA_OPTS+=("-Pwinterfox.dediNode=${WINTERFOX_DEDI_NODE} ")

JAVA_OPTS+=("$@")

/app/noelware/nino/bot/bin/bot
