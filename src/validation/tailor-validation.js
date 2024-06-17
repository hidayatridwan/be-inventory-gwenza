import Joi from "joi";

const createTailorValidation = Joi.object({
  tailor_name: Joi.string().max(100).required(),
  phone_number: Joi.string().min(0).max(20).optional(),
  address: Joi.string().optional(),
});

const searchTailorValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).positive().default(10).max(100),
  tailor_name: Joi.string().min(0).max(100).optional(),
});

const getTailorValidation = Joi.number().required();

const updateTailorValidation = Joi.object({
  tailor_id: Joi.number().required(),
  tailor_name: Joi.string().max(100).required(),
  phone_number: Joi.string().min(0).max(20).optional(),
  address: Joi.string().optional(),
});

export {
  createTailorValidation,
  searchTailorValidation,
  getTailorValidation,
  updateTailorValidation,
};
