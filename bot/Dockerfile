# 🔨 Nino: Cute, advanced discord moderation bot made in Kord.
# Copyright (c) 2019-2022 Nino Team
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

# Create the builder stage, where the bot gets built.
FROM eclipse-temurin:18-alpine AS builder

# Install git, which is required for retrieving the commit SHA
RUN apk update && apk add git ca-certificates

# Set the working directory to /build/api
WORKDIR /build/nino

# Copy everything. :)
COPY . .

# Assuming the current Docker context is the root directory.
RUN chmod +x gradlew

# Build the API.
RUN ./gradlew :bot:installDist --stacktrace --no-daemon

# The runtime image, where the API can be executed.
FROM eclipse-temurin:18-alpine

# Install bash, which is required to execute Docker scripts.
# This also installs tini, the valid "init" for containers.
RUN apk update && apk add --no-cache tini bash

# Set the working directory to /app/nino/bot
WORKDIR /app/nino/bot

# Copy the Docker scripts here
COPY docker/bot /app/nino/bot/scripts

# Copy common libraries in the scripts directory.
COPY docker/bot /app/nino/bot/scripts

# Copy the API here
COPY --from=builder /build/nino/build/install/Nino .

# Make the Docker scripts executable
RUN chmod +x /app/nino/bot/scripts/docker-entrypoint.sh /app/nino/bot/scripts/run.sh

# Do not use the root user
USER 1001

# Set the entrypoint and runner
ENTRYPOINT ["/app/nino/bot/scripts/docker-entrypoint.sh"]
CMD ["/app/nino/bot/scripts/run.sh"]
