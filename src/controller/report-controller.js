import reportService from "../service/report-service.js";

const stockCard = async (req, res, next) => {
  try {
    const productCode = req.query.product_code;

    const result = await reportService.stockCard(productCode);

    res.status(200).json({
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const inventoryStock = async (req, res, next) => {
  try {
    const request = {
      category: req.query.category,
      date_periode: req.query.date_periode,
    };

    const result = await reportService.inventoryStock(request);

    res.status(200).json({
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const dashboard = async (req, res, next) => {
  try {
    const request = {
      category: req.query.category,
      date_periode: req.query.date_periode,
    };

    const result = await reportService.dashboard(request);

    res.status(200).json({
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

export default { stockCard, inventoryStock, dashboard };
