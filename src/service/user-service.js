import { constants } from "../utils/constants.js";
import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import {
  loginUserValidation,
  registerUserValidation,
} from "../validation/user-validation.js";
import { validate } from "../validation/validation.js";
import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { getDate } from "../utils/tools.js";

const register = async (req) => {
  const user = validate(registerUserValidation, req);
  user.created_at = getDate();

  const countUser = await prismaClient.user.count({
    where: {
      username: user.username,
    },
  });

  if (countUser > 0) {
    throw new ResponseError(400, constants.RECORD_EXISTS);
  }

  user.password = await bcrypt.hash(user.password, 10);

  return await prismaClient.user.create({
    data: user,
    select: {
      username: true,
      created_at: true,
    },
  });
};

const login = async (req) => {
  const loginRequest = validate(loginUserValidation, req);

  const user = await prismaClient.user.findUnique({
    where: {
      username: loginRequest.username,
    },
    select: {
      username: true,
      password: true,
    },
  });

  if (!user) {
    throw new ResponseError(401, "Wrong username or password");
  }

  const isValidPassword = await bcrypt.compare(
    loginRequest.password,
    user.password
  );

  if (!isValidPassword) {
    throw new ResponseError(401, "Wrong username or password");
  }

  const session_id = uuid().toString();

  await prismaClient.user.update({
    data: {
      session_id,
    },
    where: {
      username: user.username,
    },
  });

  return Jwt.sign(
    {
      username: user.username,
      session_id,
    },
    process.env.PRIVATE_KEY,
    {
      expiresIn: "12h",
    }
  );
};

export default { register, login };
