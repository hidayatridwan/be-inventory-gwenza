import reportService from "../service/report-service.js";
import ExcelJS from "exceljs";

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

const products = async (req, res, next) => {
  try {
    const result = await reportService.products();

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Products");

    // Define columns
    worksheet.columns = [
      { header: "Product Code", key: "product_code", width: 15 },
      { header: "Product Name", key: "product_name", width: 30 },
      { header: "Cost Price", key: "cost_price", width: 15 },
      { header: "Selling Price", key: "selling_price", width: 15 },
      { header: "Tailor", key: "tailor", width: 20 },
      { header: "Created By", key: "created_by", width: 20 },
      { header: "Created At", key: "created_at", width: 25 },
      { header: "Modified By", key: "modified_by", width: 20 },
      { header: "Modified At", key: "modified_at", width: 25 },
    ];

    // Add to worksheet
    worksheet.addRows(result);

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=products.xlsx");

    // Write to response stream
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
};

export default { stockCard, inventoryStock, dashboard, products };
