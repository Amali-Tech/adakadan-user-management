import express from "express";
import * as winston from "winston";
import sendMail from "../helpers/mail";

export const enum HttpCode {
  OK = 200,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}
interface AppErrorArgs {
  name?: string;
  httpCode: HttpCode;
  description: string;
  isOperational?: boolean;
}

export class AppError extends Error {
  public readonly name: string;
  public readonly httpCode: HttpCode;
  public readonly isOperational: boolean = true;
  constructor(args: AppErrorArgs) {
    super(args.description);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = args.name || "Error";
    this.httpCode = args.httpCode;

    if (args.isOperational !== undefined) {
      this.isOperational = args.isOperational;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

class ErrorHandler {
  // configure log format
  private logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json(),
    winston.format.prettyPrint()
  );

  private logger = winston.createLogger({
    level: "error", // Set the desired log level
    format: this.logFormat,
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ level: "error", filename: "error.log" }), // log to file
    ],
  });
  //send mail to admin when error logs file
  private async sendMailToAdmin(err: AppError | Error) {
    await sendMail(
      [process.env.ADMIN_MAIL],
      "Application Server Error",
      `<p>${err.message}<p>`,
      [{ filename: "error.log", path: "./error.log" }]
    );
  }

  // check if error is operational
  private isTrustedError(err: Error) {
    if (err instanceof AppError) {
      return err.isOperational;
    }
    return false;
  }

  // handle trusted errors
  private handleTrustedError(err: AppError, res: express.Response) {
    res.status(err.httpCode).send({ message: err.message });
  }
  // handle untrusted errors
  private handleCriticalError(err: Error | AppError, res?: express.Response) {
    //send response if response object exists
    if (res) {
      res
        .status(HttpCode.INTERNAL_SERVER_ERROR)
        .send({ message: "Internal Server Error" });
    }
    //finally exit the process
    process.exit(1);
  }
  async handleError(
    err: Error | AppError,
    res?: express.Response
  ): Promise<void> {
    if (this.isTrustedError(err) && res) {
      this.handleTrustedError(err as AppError, res);
    } else {
      this.logger.error(err.message);
      await this.sendMailToAdmin(err);
      this.handleCriticalError(err, res);
    }
  }
}

export default new ErrorHandler();
