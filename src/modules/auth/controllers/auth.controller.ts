import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { ResponseUtils } from "../../../shared/utils/response.utils";

export class AuthController {
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await authService.register(req.body);

      return ResponseUtils.created(
        res,
        result,
        "User registered successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  async login(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result =
        await authService.login(req.body);
      return ResponseUtils.success(
        res,
        result,
        "Login Successful"
      )
    } catch (error) {
      next(error);
    }
  }

  async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result =
        await authService.refreshToken(
          req.body.refreshToken
        );

      return ResponseUtils.success(
        res,
        result,
        "Token refreshed"
      );
    } catch (error) {
      next(error);
    }
  }

  async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      await authService.logout(
        req.body.refreshToken
      );

      return ResponseUtils.success(
        res,
        null,
        "Logout successful"
      );
    } catch (error) {
      next(error);
    }
  }

  async me (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = 
      await authService.me(req.user!.id);

      return ResponseUtils.success(
        res,
        result,
        "Profile fetched successfully"
      )
    }catch (error) {
      next(error);
    }
  }

  async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const token = req.method === "GET"
        ? (req as Request & { validatedQuery: { token: string } }).validatedQuery.token
        : req.body.token;
      const result = await authService.verifyEmail(token);

      return ResponseUtils.success(
        res,
        result,
        "Email verified successfully"
      )
    }catch (error) {
      next(error);
    }
  }

  async logoutAll(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      await authService.logoutAllDevice(
        req.user!.id
      )

      return ResponseUtils.success(
        res,
        null,
        "Logout from all devices successful"
      )
    } catch (error) {
      next(error);
    }
  }

  async resendVerificationEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      await authService.resendVerificationEmail(
        req.body.email
      );

      return ResponseUtils.success(
        res,
        null,
        "Verification email sent successfully"
      )
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();