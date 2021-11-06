FROM noelware/openjdk:latest AS builder

WORKDIR /
COPY . .
RUN chmod +x gradlew
RUN ./gradlew build

FROM noelware/openjdk:latest

WORKDIR /app/Nino
COPY --from=builder /build/libs/Nino.jar /app/Nino/Nino.jar

CMD ["java", "-jar", "Nino.jar"]
