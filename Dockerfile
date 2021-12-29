FROM eclipse-temurin:17-alpine AS builder

WORKDIR /
COPY . .
RUN chmod +x gradlew
RUN ./gradlew build

FROM gcr.io/distroless/java17-debian11:latest

WORKDIR /app/noelware/nino
COPY --from=builder /build/libs/Nino.jar /app/noelware/nino/Nino.jar
COPY --from=builder /docker/docker-entrypoint.sh /app/noelware/nino/docker-entrypoint.sh
RUN chmod +x /app/noelware/nino/docker-entrypoint.sh

CMD [ "/app/noelware/nino/docker-entrypoint.sh" ]
