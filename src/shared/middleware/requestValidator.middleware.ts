import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";


export function validateRequest(
  schema: z.ZodType,
  source: "body" | "query" | "params" = "body"
) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(new AppError(
        "Invalid request data",
        400,
        "VALIDATION_ERROR"
      ));
    }

    if (source === "query") {
      (req as any).validatedQuery = result.data;
    } else if (source === "params") {
      (req as any).validatedParams = result.data;
    } else {
      req.body = result.data;
    }

    next();
  };
}