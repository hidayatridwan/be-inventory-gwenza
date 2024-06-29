import Joi from "joi";

const createProductValidation = Joi.object({
  product_name: Joi.string().max(100).required(),
  cost_price: Joi.number().required(),
  selling_price: Joi.number().required(),
  tailor_id: Joi.number().required(),
  models: Joi.array()
    .min(1)
    .items(
      Joi.object({
        model_id: Joi.number().required(),
        image: Joi.string().max(100).required(),
      })
    )
    .required(),
});

const searchProductValidation = Joi.object({
  page: Joi.number().min(1).positive().default(1),
  size: Joi.number().min(1).positive().default(10).max(100),
  product_code: Joi.string().min(0).max(20).optional(),
  product_name: Joi.string().min(0).max(100).optional(),
});

const getProductValidation = Joi.number().required();

const updateProductValidation = Joi.object({
  product_id: Joi.number().required(),
  product_name: Joi.string().max(100).required(),
  cost_price: Joi.number().required(),
  selling_price: Joi.number().required(),
  tailor_id: Joi.number().required(),
  // models: Joi.array()
  //   .min(1)
  //   .items(
  //     Joi.object({
  //       product_id: Joi.number().required(),
  //       model_id: Joi.number().required(),
  //       image: Joi.string().max(100).required(),
  //     })
  //   )
  //   .required(),
});

export {
  createProductValidation,
  searchProductValidation,
  getProductValidation,
  updateProductValidation,
};
