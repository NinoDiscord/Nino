FROM alpine:latest AS builder

# Install alpine dependencies
RUN apk add --no-cache git curl ca-certificates && rm -rf /var/cache/apk/*
RUN mkdir -p /opt/adoptopenjdk
RUN curl -X GET -L -o /tmp/adoptopenjdk.tar.gz https://github.com/AdoptOpenJDK/openjdk16-binaries/releases/download/jdk-16.0.1%2B9/OpenJDK16U-jdk_x64_alpine-linux_hotspot_16.0.1_9.tar.gz
RUN tar -xvf /tmp/adoptopenjdk.tar.gz -C /opt/adoptopenjdk
RUN rm /tmp/adoptopenjdk.tar.gz
ENV JAVA_HOME="/opt/adoptopenjdk/jdk-16.0.1+9" \
    PATH="/opt/adoptopenjdk/jdk-16.0.1+9/bin:$PATH"

WORKDIR /
COPY . .
RUN chmod +x gradlew
RUN ./gradlew build
RUN rm -rf *.gradle.kts .idea .gradle gradle src gradle.properties gradlew gradlew.bat
RUN mkdir .nino_cache && cp ./build/libs/Nino.jar .nino_cache/Nino.jar

# nuke this ratio
RUN rm -rf build

FROM alpine:latest

WORKDIR /app/Nino
RUN mkdir /opt/adoptopenjdk
COPY --from=builder /assets /app/Nino/assets
COPY --from=builder "/opt/adoptopenjdk/jdk-16.0.1+9" "/opt/adoptopenjdk"
ENV JAVA_HOME="/opt/adoptopenjdk" \
    PATH="/opt/adoptopenjdk/bin:$PATH"

COPY --from=builder /.nino_cache/Noel.jar /app/Nino/Nino.jar
CMD ["java", "-jar", "Nino.jar"]
