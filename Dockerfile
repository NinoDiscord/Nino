FROM eclipse-temurin:17-alpine AS builder

RUN apk update && apk add git ca-certificates
WORKDIR /
COPY . .
RUN chmod +x gradlew && ./gradlew :bot:build --stacktrace

FROM eclipse-temurin:17-alpine AS builder

WORKDIR /app/noelware/nino
COPY --from=builder /docker/run.sh               /app/noelware/nino/run.sh
COPY --from=builder /bot/build/libs/Nino.jar     /app/noelware/nino/Nino.jar
COPY --from=builder /docker/scripts/liblog.sh    /app/noelware/nino/scripts/liblog.sh
COPY --from=builder /docker/docker-entrypoint.sh /app/noelware/nino/docker-entrypoint.sh

ENTRYPOINT [ "/app/noelware/nino/docker-entrypoint.sh" ]
CMD [ "/app/noelware/nino/run.sh" ]
