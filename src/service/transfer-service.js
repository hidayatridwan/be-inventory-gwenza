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
    select: {
      product_id: true,
      product_code: true,
      product_name: true,
      cost_price: true,
      selling_price: true,
      tailor: {
        select: {
          tailor_name: true,
        },
      },
      product_model: {
        select: {
          image: true,
          model: {
            select: {
              model_name: true,
              inventory: {
                select: {
                  category: true,
                  quantity: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  // Reformatting the result
  const formattedResult = {
    product_id: result.product_id,
    product_code: result.product_code,
    product_name: result.product_name,
    cost_price: result.cost_price,
    selling_price: result.selling_price,
    qr_code: result.qr_code,
    tailor_name: result.tailor.tailor_name,
    model: result.product_model.map((pm) => ({
      image: pm.image,
      model_name: pm.model.model_name,
      inventory: pm.model.inventory.map((inv) => ({
        category: inv.category,
        quantity: inv.quantity,
      })),
    })),
  };

  return formattedResult;
};

const create = async (user, req) => {
  const transfer = validate(createTransferValidation, req);
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
          created_by: user.username,
        },
      });
    }
  });

  return result;
};

export default { get, create };
