import errorHandler from './config/errorHandler';
process.on('unhandledRejection', (reason: Error | any) => {
  throw new Error(reason.message || reason);
});

process.on('uncaughtException', (error: Error) => {
  errorHandler.handleError(error);
});
