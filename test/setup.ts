import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";

// Set required env vars for tests before any imports
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";
process.env.REDIS_PASSWORD = "test-redis-password";
process.env.JWT_SECRET = "test-jwt-secret-with-minimum-32-characters";
process.env.LOG_LEVEL = "error";
process.env.SMTP_HOST = "localhost";
process.env.SMTP_PORT = "587";
process.env.SMTP_USER = "test@example.com";
process.env.SMTP_PASS = "test-smtp-password";
process.env.SMTP_FROM = "test@example.com";
process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
process.env.GOOGLE_CALLBACK_URL = "http://localhost:3000/api/auth/google/callback";
process.env.PAYMENT_MODE = "simulated";
process.env.MIDTRANS_IS_PRODUCTION = "false";

beforeAll(async () => {

});

afterAll(async () => {

});

beforeEach(async () => {

});

afterEach(async () => {

});