import Joi from "joi";

const registerUserValidation = Joi.object({
  username: Joi.string().max(20).required(),
  password: Joi.string().max(200).required(),
});

const loginUserValidation = Joi.object({
  username: Joi.string().max(20).required(),
  password: Joi.string().max(200).required(),
});

export { registerUserValidation, loginUserValidation };
