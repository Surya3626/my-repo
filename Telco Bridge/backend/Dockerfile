# Build Stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Compile with Lombok configuration
RUN mvn clean package -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/onboarding-1.0.0.jar app.jar
EXPOSE 8080
VOLUME /app/data
VOLUME /app/uploads
ENTRYPOINT ["java", "-jar", "app.jar"]
