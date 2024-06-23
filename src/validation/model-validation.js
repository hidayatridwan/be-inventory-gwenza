import Joi from "joi";

const createModelValidation = Joi.object({
  model_name: Joi.string().max(100).required(),
});

const searchModelValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).positive().default(10).max(100),
  model_name: Joi.string().min(0).max(100).optional(),
});

const getModelValidation = Joi.number().required();

const updateModelValidation = Joi.object({
  model_id: Joi.number().required(),
  model_name: Joi.string().max(100).required(),
});

export {
  createModelValidation,
  searchModelValidation,
  getModelValidation,
  updateModelValidation,
};
