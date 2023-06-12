import express from "express";
import * as http from "http";
import { config } from "dotenv";
import debug from "debug";
import app from "./config/app";
config();

const server: http.Server = http.createServer(app);
const port = process.env.PORT ?? 3000;
const log: debug.IDebugger = debug("app");

// this is a simple route to make sure everything is working properly
const runningMessage = `Server running at http://localhost:${port}`;
app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).send(runningMessage);
});

(async () => {

  server.listen(port, () => {
    // our only exception to avoiding console.log(), because we
    // always want to know when the server is done starting up
    log(runningMessage);
  });
})();
