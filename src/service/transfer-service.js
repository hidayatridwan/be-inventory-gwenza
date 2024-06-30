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
          model_id: true,
          image: true,
          model: {
            select: {
              model_name: true,
            },
          },
        },
      },
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  const inventoryPromises = result.product_model.map(async (pm) => {
    return await prismaClient.inventory.findMany({
      where: {
        product_id: result.product_id,
        model_id: pm.model_id,
      },
      select: {
        product_id: true,
        category: true,
        model_id: true,
        quantity: true,
      },
    });
  });

  const nestedArray = await Promise.all(inventoryPromises);
  const inventory = nestedArray.flat();

  // Reformatting the result
  const formattedResult = {
    product_id: result.product_id,
    product_code: result.product_code,
    product_name: result.product_name,
    cost_price: result.cost_price,
    selling_price: result.selling_price,
    tailor_name: result.tailor.tailor_name,
    model: result.product_model.map((pm) => ({
      model_id: pm.model_id,
      model_name: pm.model.model_name,
      image: pm.image,
      inventory: inventory
        .filter((i) => i.model_id === pm.model_id)
        .map((i) => ({
          category: i.category,
          quantity: i.quantity,
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

      // If new quantity is less than 0, throw an error to trigger rollback
      if (newQuantity < 0) {
        throw new ResponseError(400, "Quantity cannot be less than 0");
      }

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
      // If inventory is not found and type is "Out", throw an error to trigger rollback
      if (result.type === "Out") {
        throw new ResponseError(400, 'Type is "Out" but inventory not found');
      }

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
