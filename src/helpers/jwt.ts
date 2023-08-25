import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from 'dotenv';
config();



class JWTUtils {
  
  signJWT = async (object:object, options?: jwt.SignOptions | undefined) => {
    const token: string = jwt.sign(
      object,
      process.env.ACCESS_TOKEN_SECRET ,
      { ...options }
    );
    return token;
  };
  refreshToken = async (object:  object, options?: jwt.SignOptions | undefined) => {
    const token: string = jwt.sign(
      object,
      process.env.REFRESH_TOKEN_SECRET,
      {...options}
    );
    return token;
  };

  verifyJWT = async (token: string, secret: string) :Promise<{
    valid: boolean,
    expired: boolean | string ,
    decoded: JwtPayload | null
  }>=> {
    try {
      const decoded : JwtPayload = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET
      ) as JwtPayload;

      return {
        valid: true,
        expired: false,
        decoded
      }
    } catch (err : any) {
        return {
          valid: false,
          expired : err.message === "jwt expired",
          decoded : null
        }
    }
  };

  validate = async (user: { id: string; userType: string }) => {
    const token: string = jwt.sign(
      { id: user.id, userType: user.userType },
      process.env.TIMER_TOKEN_SECRET,
      { expiresIn: process.env.TIMER_TOKEN_EXPIRES  }
    );
    return token;
  };
  hasExpired = async (token: string) => {
    const payload = jwt.decode(token) as JwtPayload;
    return (payload.exp ) > Date.now();
  };
}

export default new JWTUtils();
