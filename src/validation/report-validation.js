import Joi from "joi";

const stockCardReportValidation = Joi.string().min(0).max(20).required();

const inventoryStockReportValidation = Joi.object({
  category: Joi.string().valid("All", "Good", "Bad", "Retur").required(),
  date_start: Joi.date().required(),
  date_end: Joi.date().required(),
});

export { stockCardReportValidation, inventoryStockReportValidation };
