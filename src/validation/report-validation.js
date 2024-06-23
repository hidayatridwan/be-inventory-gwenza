import Joi from "joi";

const stockCardReportValidation = Joi.object({
  category: Joi.string().valid("Good", "Bad").required(),
  product_code: Joi.string().min(0).max(20).optional(),
});

const inventoryStockProductValidation = Joi.string()
  .valid("Good", "Bad", "Retur")
  .required();

export { stockCardReportValidation, inventoryStockProductValidation };
