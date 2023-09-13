import express from "express";

export abstract class CommonRoutesConfig {
  app: express.Application;
  name:string;
  versions:Record<string, string>;
  constructor(app: express.Application, name:string) {
    this.app = app;
    this.name = name;
    this.versions = {
      v1: "api/v1"
    }
    this.configureRoutes();
  }
  getName() {
     return this.name;
   }

  abstract configureRoutes() : express.Application ;
}