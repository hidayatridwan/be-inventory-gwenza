import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { constants } from "../utils/constants.js";
import {
  createTransferValidation,
  transactionTransferValidation,
} from "../validation/transfer-validation.js";
import { validate } from "../validation/validation.js";
import { getDate } from "../utils/tools.js";

const get = async (productCode) => {
  productCode = validate(transactionTransferValidation, productCode);

  const result = await prismaClient.product.findUnique({
    where: {
      product_code: productCode,
    },
    include: {
      tailor: {
        select: {
          tailor_name: true,
        },
      },
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  const stockProduct = await prismaClient.$queryRaw`SELECT 
      IFNULL(SUM(IF(type = 'In',
                  quantity,
                  quantity * - 1)),
              0) AS stock
  FROM
      transfer
  WHERE
      category = 'Good' AND product_id = ${result.product_id};`;

  result.stock = stockProduct[0].stock;

  return result;
};

const create = async (user, req) => {
  const transfer = validate(createTransferValidation, req);
  transfer.transfer_date = transfer.created_at = getDate();
  transfer.created_by = user.username;

  let result;

  await prismaClient.$transaction(async (tx) => {
    result = await tx.transfer.create({
      data: transfer,
      select: {
        transfer_id: true,
        transfer_date: true,
        product: {
          select: {
            product_id: true,
            product_code: true,
            product_name: true,
          },
        },
        model: {
          select: {
            model_id: true,
            model_name: true,
          },
        },
        category: true,
        type: true,
        quantity: true,
        remark: true,
        created_at: true,
      },
    });

    const inventory = await tx.inventory.findUnique({
      where: {
        product_id_model_id_category: {
          product_id: result.product.product_id,
          model_id: result.model.model_id,
          category: result.category,
        },
      },
      select: {
        quantity: true,
      },
    });

    if (inventory) {
      const newQuantity =
        result.type === "In"
          ? inventory.quantity + result.quantity
          : inventory.quantity - result.quantity;

      await tx.inventory.update({
        where: {
          product_id_model_id_category: {
            product_id: result.product.product_id,
            model_id: result.model.model_id,
            category: result.category,
          },
        },
        data: {
          quantity: newQuantity,
        },
      });
    } else {
      await tx.inventory.create({
        data: {
          product_id: result.product.product_id,
          model_id: result.model.model_id,
          category: result.category,
          quantity: result.quantity,
        },
      });
    }
  });

  return result;
};

export default { get, create };
