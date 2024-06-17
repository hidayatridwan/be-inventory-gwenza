import transferService from "../service/transfer-service.js";

const get = async (req, res, next) => {
  try {
    const productCode = req.params.productCode;

    const result = await transferService.get(productCode);

    res.status(200).json({
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await transferService.create(req.user, req.body);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export default { get, create };
