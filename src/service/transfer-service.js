import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { constants } from "../utils/constants.js";
import {
  createTransferValidation,
  transactionTransferValidation,
} from "../validation/transfer-validation.js";
import { validate } from "../validation/validation.js";

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
  transfer.transfer_date = new Date().toISOString();
  transfer.created_by = user.username;

  return await prismaClient.transfer.create({
    data: transfer,
    select: {
      transfer_id: true,
      transfer_date: true,
      category: true,
      type: true,
      quantity: true,
      remark: true,
      created_at: true,
    },
  });
};

export default { get, create };
