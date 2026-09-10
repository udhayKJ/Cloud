-- V1__create_users.sql
-- CloudShift AI — Users table

CREATE TABLE users (
    id           VARCHAR(36)  NOT NULL,
    email        VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name    VARCHAR(255),
    role         VARCHAR(50)  NOT NULL DEFAULT 'USER',
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP,

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE INDEX idx_users_email ON users(email);
