import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { constants } from "../utils/constants.js";
import {
  inventoryStockProductValidation,
  stockCardReportValidation,
} from "../validation/report-validation.js";
import { validate } from "../validation/validation.js";

const stockCard = async (req) => {
  req = validate(stockCardReportValidation, req);

  const product = await prismaClient.product.findUnique({
    where: {
      product_code: req.product_code,
    },
    select: {
      product_id: true,
      product_code: true,
      product_name: true,
      cost_price: true,
      selling_price: true,
    },
  });

  if (!product) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  const productId = product.product_id;

  // Fetch 'In' transfers
  const inTransfers = await prismaClient.transfer.findMany({
    where: {
      category: req.category,
      type: "In",
      product_id: productId,
    },
    select: {
      transfer_id: true,
      transfer_date: true,
      remark: true,
      quantity: true,
    },
  });

  // Fetch 'Out' transfers
  const outTransfers = await prismaClient.transfer.findMany({
    where: {
      category: req.category,
      type: "Out",
      product_id: productId,
    },
    select: {
      transfer_id: true,
      transfer_date: true,
      remark: true,
      quantity: true,
    },
  });

  // Combine and format the results
  const combinedResults = [
    ...inTransfers.map((transfer) => ({
      transfer_id: transfer.transfer_id,
      transfer_date: transfer.transfer_date,
      remark: transfer.remark,
      qty_in: transfer.quantity,
      qty_out: 0,
    })),
    ...outTransfers.map((transfer) => ({
      transfer_id: transfer.transfer_id,
      transfer_date: transfer.transfer_date,
      remark: transfer.remark,
      qty_in: 0,
      qty_out: transfer.quantity,
    })),
  ];

  // Sort by transfer_id
  combinedResults.sort((a, b) => a.transfer_id - b.transfer_id);

  return { info: product, stock: combinedResults };
};

const inventoryStock = async (category) => {
  category = validate(inventoryStockProductValidation, category);

  const products = await prismaClient.product.findMany({
    include: {
      transfer: true,
    },
  });

  const result = products.map((product) => {
    const qty_in = product.transfer
      .filter(
        (transfer) => transfer.type === "In" && transfer.category === category
      )
      .reduce((sum, transfer) => sum + transfer.quantity, 0);

    const qty_out = product.transfer
      .filter(
        (transfer) => transfer.type === "Out" && transfer.category === category
      )
      .reduce((sum, transfer) => sum + transfer.quantity, 0);

    const balance = qty_in - qty_out;
    const cost_price = balance * product.cost_price;
    const selling_price = balance * product.selling_price;
    const margin = selling_price - cost_price;

    return {
      product_id: product.product_id,
      product_code: product.product_code,
      product_name: product.product_name,
      qty_in,
      qty_out,
      balance,
      cost_price,
      selling_price,
      margin,
    };
  });

  return result;
};

const dashboard = async () => {
  const dashboard = await prismaClient.$queryRaw`SELECT 
    (SELECT 
            SUM(quantity) AS qty_in
        FROM
            transfer
        WHERE
            category = 'Good' AND type = 'In') AS qty_in,
    (SELECT 
            SUM(quantity) AS qty_out
        FROM
            transfer
        WHERE
            category = 'Good' AND type = 'Out') AS qty_out,
    (SELECT 
            SUM(cost_price) AS cost_price
        FROM
            (SELECT 
                SUM(quantity) * pr.cost_price AS cost_price
            FROM
                transfer AS tf
            JOIN product AS pr ON tf.product_id = pr.product_id
            WHERE
                category = 'Good' AND type = 'In'
            GROUP BY tf.product_id) AS cp) AS cost_price,
    (SELECT 
            SUM(selling_price) AS selling_price
        FROM
            (SELECT 
                SUM(quantity) * pr.selling_price AS selling_price
            FROM
                transfer AS tf
            JOIN product AS pr ON tf.product_id = pr.product_id
            WHERE
                category = 'Good' AND type = 'In'
            GROUP BY tf.product_id) AS sp) AS selling_price;`;

  const result = dashboard[0];
  result.qty_in = parseInt(result.qty_in);
  result.qty_out = parseInt(result.qty_out);
  result.qty_margin = result.qty_in - result.qty_out;
  result.price_margin = result.selling_price - result.cost_price;

  return result;
};

export default { stockCard, inventoryStock, dashboard };
