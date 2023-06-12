import express from "express";
import { UsersRoutes } from "../users/users.route.config";
import cors from "cors";
import { CommonRoutesConfig } from "../common/common.routes.config";
import debug from "debug";
import * as winston from "winston";
import * as expressWinston from "express-winston";
import helmet from "helmet";


const debugLog: debug.IDebugger = debug("app:configuration");
// here we are preparing the expressWinston logging middleware configuration,
// which will automatically log all HTTP requests handled by Express.js
const loggerOptions: expressWinston.LoggerOptions = {
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.prettyPrint(),
    winston.format.colorize({ all: true }),
    winston.format.timestamp()
  ),
};

if (!process.env.DEBUG) {
  loggerOptions.meta = false; // when not debugging, log requests as one-liners
  if (typeof global.it === 'function') {
           loggerOptions.level = 'http'; // for non-debug test runs, squelch entirely
       }
}

class App {
  public app: express.Application;

  private userRoutes: UsersRoutes;
  private definedRoutes: Array<CommonRoutesConfig> = [];

  constructor() {
    this.app = express();
    this.config();
    this.userRoutes = new UsersRoutes(this.app);
    // here we are adding the UserRoutes to our array,
    // after sending the Express.js application object to have the routes added to our app!
    this.definedRoutes.push(this.userRoutes);

    this.debugger();
  }

  private config(): void {
    // support application/json type post data
    this.app.use(express.json());
    //support application/x-www-form-urlencoded post data
    this.app.use(express.urlencoded({ extended: false }));
    // here we are adding middleware to allow cross-origin requests
    this.app.use(cors());
    this.app.use(helmet())
    // initialize the logger with the above configuration
    this.app.use(expressWinston.logger(loggerOptions));
  }

  private debugger(): void {
    this.definedRoutes.forEach((route: CommonRoutesConfig) => {
      debugLog(`Routes configured for ${route.getName()}`);
    });
  }
}

export default new App().app;
