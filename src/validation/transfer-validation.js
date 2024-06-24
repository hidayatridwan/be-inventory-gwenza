import Joi from "joi";

const transactionTransferValidation = Joi.string().min(1).max(20).required();

const createTransferValidation = Joi.object({
  product_id: Joi.number().required(),
  model_id: Joi.number().required(),
  quantity: Joi.number().required(),
  remark: Joi.string().required(),
  category: Joi.string().valid("Good", "Bad", "Retur").required(),
  type: Joi.string().valid("In", "Out").required(),
});

export { transactionTransferValidation, createTransferValidation };
