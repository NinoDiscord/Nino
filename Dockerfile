FROM eclipse-temurin:17-alpine AS builder

RUN apk update && apk add git ca-certificates
WORKDIR /
COPY . .
RUN chmod +x gradlew
RUN ./gradlew :bot:build --stacktrace

FROM eclipse-temurin:17-alpine

WORKDIR /app/noelware/nino
COPY --from=builder /bot/build/libs/Nino.jar /app/noelware/nino/Nino.jar
COPY --from=builder /docker/docker-entrypoint.sh /app/noelware/nino/docker-entrypoint.sh
RUN chmod +x /app/noelware/nino/docker-entrypoint.sh

CMD [ "/app/noelware/nino/docker-entrypoint.sh" ]
