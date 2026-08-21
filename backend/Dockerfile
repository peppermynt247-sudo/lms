FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn package -DskipTests -B -q || true

COPY src ./src
RUN mvn clean package -DskipTests -Pprod -B

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN groupadd -r atoms && useradd -r -g atoms atoms

RUN mkdir -p /var/log/atoms /opt/uploads /app/certs \
    && chown -R atoms:atoms /var/log/atoms /opt/uploads /app/certs

COPY --from=builder --chown=atoms:atoms /app/target/*.war app.war

USER atoms

EXPOSE 9080

ENV JAVA_TOOL_OPTIONS="\
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -XX:InitialRAMPercentage=50.0 \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+ExitOnOutOfMemoryError \
  -Djava.security.egd=file:/dev/./urandom \
  -Dserver.port=9080"

ENV SPRING_PROFILES_ACTIVE=prod

ENTRYPOINT ["java", "-jar", "/app/app.war"]
