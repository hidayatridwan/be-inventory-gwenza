import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { constants } from "../utils/constants.js";
import {
  inventoryStockReportValidation,
  stockCardReportValidation,
} from "../validation/report-validation.js";
import { validate } from "../validation/validation.js";

const stockCard = async (productCode) => {
  productCode = validate(stockCardReportValidation, productCode);

  const product = await prismaClient.product.findUnique({
    where: {
      product_code: productCode,
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
      type: "In",
      product_id: productId,
    },
    select: {
      transfer_id: true,
      transfer_date: true,
      category: true,
      model: {
        select: {
          model_name: true,
        },
      },
      remark: true,
      quantity: true,
    },
  });

  // Fetch 'Out' transfers
  const outTransfers = await prismaClient.transfer.findMany({
    where: {
      type: "Out",
      product_id: productId,
    },
    select: {
      transfer_id: true,
      transfer_date: true,
      category: true,
      model: {
        select: {
          model_name: true,
        },
      },
      remark: true,
      quantity: true,
    },
  });

  // Combine and format the results
  const combinedResultsTransfers = [
    ...inTransfers.map((transfer) => ({
      transfer_id: transfer.transfer_id,
      transfer_date: transfer.transfer_date,
      category: transfer.category,
      model: transfer.model.model_name,
      remark: transfer.remark,
      qty_in: transfer.quantity,
      qty_out: 0,
    })),
    ...outTransfers.map((transfer) => ({
      transfer_id: transfer.transfer_id,
      transfer_date: transfer.transfer_date,
      category: transfer.category,
      model: transfer.model.model_name,
      remark: transfer.remark,
      qty_in: 0,
      qty_out: transfer.quantity,
    })),
  ];

  // Sort by transfer_id
  combinedResultsTransfers.sort((a, b) => a.transfer_id - b.transfer_id);

  // Calculate summary
  const summaryStock = await prismaClient.inventory.findMany({
    where: {
      product_id: productId,
    },
    select: {
      category: true,
      model: {
        select: {
          model_name: true,
        },
      },
      quantity: true,
    },
  });

  const summaryStockFormatted = summaryStock
    .map((stock) => ({
      category: stock.category,
      model: stock.model.model_name,
      quantity: stock.quantity,
    }))
    .sort((a, b) => a.model.localeCompare(b.model));

  return {
    info: product,
    transfers: combinedResultsTransfers,
    summary: summaryStockFormatted,
  };
};

const inventoryStock = async (req) => {
  req = validate(inventoryStockReportValidation, req);
  const category = req.category;
  const datePeriode = req.date_periode;

  const stocks = await prismaClient.$queryRaw`SELECT 
      pr.product_code,
      pr.product_name,
      pr.cost_price,
      pr.selling_price,
      tf.category,
      md.model_name,
      SUM(IF(tf.type = 'In', tf.quantity, 0)) AS qty_in,
      SUM(IF(tf.type = 'Out', tf.quantity, 0)) AS qty_out,
      IFNULL(SUM(IF(tf.type = 'In',
          tf.quantity,
          tf.quantity * - 1)),
      0) AS balance
  FROM
      product AS pr
          LEFT JOIN
      (SELECT 
          *
      FROM
          transfer
      WHERE
          IF(${category} = 'All', 1 = 1, category = ${category})
              AND DATE(transfer_date) <= ${datePeriode}) AS tf ON pr.product_id = tf.product_id
          LEFT JOIN
      model AS md ON tf.model_id = md.model_id
  GROUP BY pr.product_id , tf.category , tf.model_id`;

  // Calculate balance price
  const result = stocks.map((stock) => ({
    product_code: stock.product_code,
    product_name: stock.product_name,
    category: stock.category,
    model_name: stock.model_name,
    qty_in: parseInt(stock.qty_in),
    qty_out: parseInt(stock.qty_out),
    qty_balance: parseInt(stock.balance),
    cost_price: parseInt(stock.balance) * parseInt(stock.cost_price),
    selling_price: parseInt(stock.balance) * parseInt(stock.selling_price),
    balance_price:
      parseInt(stock.balance) * parseInt(stock.selling_price) -
      parseInt(stock.balance) * parseInt(stock.cost_price),
  }));

  return result;
};

const dashboard = async (req) => {
  req = validate(inventoryStockReportValidation, req);
  const category = req.category;
  const datePeriode = req.date_periode;

  const summaries = await prismaClient.$queryRaw`SELECT 
    (SELECT 
            SUM(quantity) AS qty_in
        FROM
            transfer
        WHERE
            IF(${category} = 'All',
                1 = 1,
                category = ${category})
                AND type = 'In'
                AND DATE(transfer_date) <= ${datePeriode}) AS qty_in,
    (SELECT 
            SUM(quantity) AS qty_out
        FROM
            transfer
        WHERE
            IF(${category} = 'All',
                1 = 1,
                category = ${category})
                AND type = 'Out'
                AND DATE(transfer_date) <= ${datePeriode}) AS qty_out,
    (SELECT 
            SUM(cost_price) AS cost_price
        FROM
            (SELECT 
                SUM(quantity) * pr.cost_price AS cost_price
            FROM
                transfer AS tf
            JOIN product AS pr ON tf.product_id = pr.product_id
            WHERE
                IF(${category} = 'All', 1 = 1, category = ${category})
                    AND type = 'In'
                    AND DATE(transfer_date) <= ${datePeriode}
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
                IF(${category} = 'All', 1 = 1, category = ${category})
                    AND type = 'In'
                    AND DATE(transfer_date) <= ${datePeriode}
            GROUP BY tf.product_id) AS sp) AS selling_price;`;

  // Calculate balance price
  const result = summaries.map((summary) => ({
    qty_in: parseInt(summary.qty_in),
    qty_out: parseInt(summary.qty_out),
    qty_balance: parseInt(summary.qty_in) - parseInt(summary.qty_out),
    cost_price: parseInt(summary.cost_price),
    selling_price: parseInt(summary.selling_price),
    balance_price:
      parseInt(summary.selling_price) - parseInt(summary.cost_price),
  }));

  return result[0];
};

const products = async () => {
  const result = await prismaClient.product.findMany({
    select: {
      product_code: true,
      product_name: true,
      cost_price: true,
      selling_price: true,
      created_by: true,
      created_at: true,
      modified_by: true,
      modified_at: true,
      tailor: {
        select: {
          tailor_name: true,
        },
      },
    },
  });

  return result.map((product) => ({
    ...product,
    tailor: product.tailor.tailor_name,
  }));
};

export default { stockCard, inventoryStock, dashboard, products };
