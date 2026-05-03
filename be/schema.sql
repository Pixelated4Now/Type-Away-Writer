-- Creating the users table in PostreSQL DB.

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP
);