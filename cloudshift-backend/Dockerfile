# ===================================================
# CloudShift AI Backend — Multi-stage Dockerfile
# Stage 1: Build fat jar with Maven
# Stage 2: Run on JRE 17 slim (no JDK in prod image)
# ===================================================

# ===== Stage 1: Build =====
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /build

# Copy dependency manifests first (Docker layer cache — only re-downloads on pom.xml changes)
COPY pom.xml .
RUN mvn -B dependency:go-offline -q 2>/dev/null || true

# Copy source and build
COPY src ./src
RUN mvn -B clean package -DskipTests -q

# ===== Stage 2: Runtime =====
FROM eclipse-temurin:17-jre-alpine AS runtime

# Non-root user for security
RUN addgroup -S cloudshift && adduser -S cloudshift -G cloudshift

WORKDIR /app

# Copy fat jar from build stage
COPY --from=builder /build/target/cloudshift-backend-*.jar app.jar

# Change ownership
RUN chown cloudshift:cloudshift app.jar

USER cloudshift

# Expose app port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

# JVM tuning for container environment
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
