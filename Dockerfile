FROM noelware/openjdk:latest

WORKDIR /app/Nino
COPY . .
RUN chmod +x gradlew
RUN ./gradlew build
RUN rm -rf *.gradle.kts .idea .gradle gradle src gradle.properties gradlew gradlew.bat
RUN cp ./build/libs/Nino.jar Nino.jar
RUN rm -rf build

CMD ["java", "-jar", "Nino.jar"]
