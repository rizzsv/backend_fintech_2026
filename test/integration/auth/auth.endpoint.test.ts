import request from "supertest";
import { describe, expect, it, vi, beforeEach } from "vitest";


import { authService } from "../../../src/modules/auth/services/auth.service";
import { registerSchema } from "../../../src/modules/auth/validators/auth.validator";
import { validateRequest } from "../../../src/shared/middleware/requestValidator.middleware";
import app from "../../../src/app";

vi.mock(
    "../../../src/modules/auth/services/auth.service",
    () => ({
        authService: {
            register: vi.fn(),
            login: vi.fn(),
            refreshToken: vi.fn(),
            logout: vi.fn(),
            me: vi.fn(),
            logoutAllDevice: vi.fn(),
            resendVerificationEmail: vi.fn(),
        },
    })
);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("Auth Endpoint", () => {

        beforeEach(() => {
        vi.clearAllMocks();
    });

    it("POST /register should return 201", async () => {

        vi.mocked(authService.register)
            .mockResolvedValue({
                id: "user-1",
                email: "test@gmail.com",
            });

const response = await request(app)
    .post("/api/v1/auth/register")
    .send({
        email: "test@gmail.com",
        phoneNumber: "081234567890",
        password: "password123",
    });

        console.log(response.status);
        console.log(response.body);

        expect(response.status).toBe(201);

        expect(response.body.data.email)
            .toBe("test@gmail.com");

    });

});

validateRequest(registerSchema)

it("should reject invalid email", async () => {

    const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
            email: "abc",
            phoneNumber: "081234567890",
            password: "password123",
        });

    expect(response.status).toBe(400);

});