import reportService from "../service/report-service.js";

const stockCard = async (req, res, next) => {
  try {
    const request = {
      category: req.query.category,
      product_code: req.query.product_code,
    };

    const result = await reportService.stockCard(request);

    res.status(200).json({
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const inventoryStock = async (req, res, next) => {
  try {
    const category = req.query.category;

    const result = await reportService.inventoryStock(category);

    res.status(200).json({
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const dashboard = async (req, res, next) => {
  try {
    const result = await reportService.dashboard();

    res.status(200).json({
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

export default { stockCard, inventoryStock, dashboard };
