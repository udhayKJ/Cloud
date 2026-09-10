package com.cloudshift;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * CloudShift AI — Backend Entry Point
 * <p>
 * Run locally (H2 dev profile):
 *   mvn spring-boot:run -Dspring-boot.run.profiles=dev
 * <p>
 * Run production (RDS):
 *   java -jar cloudshift-backend.jar --spring.profiles.active=prod
 */
@SpringBootApplication
@EnableJpaAuditing
public class CloudShiftApplication {

    public static void main(String[] args) {
        SpringApplication.run(CloudShiftApplication.class, args);
    }
}
