import express from 'express';

const requireUser = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user = res.locals.user;
  if (!user) {
    return res.status(403).send({ success: false, message: 'Please, log in' });
    
  }
  return next();
};

export default requireUser;
