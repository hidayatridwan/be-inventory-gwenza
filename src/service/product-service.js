import { prismaClient } from "../application/database.js";
import {
  createProductValidation,
  getProductValidation,
  searchProductValidation,
  updateProductValidation,
} from "../validation/product-validation.js";
import { validate } from "../validation/validation.js";
import { ResponseError } from "../error/response-error.js";
import { generateProductCode, generateQRCode } from "../utils/qrcode.js";
import { constants } from "../utils/constants.js";
import { deleteImage } from "../utils/tools.js";

const create = async (user, req) => {
  const product = validate(createProductValidation, req);
  product.created_by = user.username;

  return prismaClient.$transaction(async (tx) => {
    const productCode = await generateProductCode(tx);
    product.product_code = productCode;
    product.qr_code = generateQRCode(productCode);

    const { models, ...newProduct } = product;

    return await tx.product.create({
      data: {
        ...newProduct,
        product_model: {
          create: models,
        },
      },
      select: {
        product_id: true,
        product_code: true,
        product_name: true,
        product_model: {
          select: {
            model_id: true,
            image: true,
          },
        },
        created_at: true,
      },
    });
  });
};

const search = async (req) => {
  req = validate(searchProductValidation, req);

  const skip = (req.page - 1) * req.size;

  const filters = [];
  if (req.product_code) {
    filters.push({
      product_code: {
        contains: req.product_code,
      },
    });
  }
  if (req.product_name) {
    filters.push({
      product_name: {
        contains: req.product_name,
      },
    });
  }

  const result = await prismaClient.product.findMany({
    where: {
      AND: filters,
    },
    select: {
      product_id: true,
      product_code: true,
      product_name: true,
      cost_price: true,
      selling_price: true,
      qr_code: true,
    },
    take: req.size,
    skip: skip,
  });

  const totalItem = await prismaClient.product.count({
    where: {
      AND: filters,
    },
  });

  return {
    data: result,
    paging: {
      page: req.page,
      size: req.size,
      total_items: totalItem,
      total_pages: Math.ceil(totalItem / req.size),
    },
  };
};

const get = async (productId) => {
  productId = validate(getProductValidation, productId);

  const result = await prismaClient.product.findUnique({
    where: {
      product_id: productId,
    },
    select: {
      product_id: true,
      product_code: true,
      product_name: true,
      cost_price: true,
      selling_price: true,
      qr_code: true,
      tailor_id: true,
      product_model: {
        select: {
          model_id: true,
          image: true,
        },
      },
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  const transformedResult = {
    ...result,
    models: result.product_model,
  };
  delete transformedResult.product_model;

  return transformedResult;
};

const update = async (user, req) => {
  req = validate(updateProductValidation, req);
  req.modified_by = user.username;

  const { product_id, models, ...newRequest } = req;

  return prismaClient.$transaction(async (tx) => {
    const countProduct = await tx.product.count({
      where: {
        product_id,
      },
    });

    if (countProduct === 0) {
      throw new ResponseError(404, constants.NOT_FOUND);
    }

    const modelImages = await tx.productModel.findMany({
      where: {
        product_id,
      },
    });

    const mergeImages = modelImages.map((model, index) => {
      return {
        model_id: model.model_id,
        image: model.image,
        new_image: models[index].image,
      };
    });

    mergeImages.forEach((model) => {
      if (model.new_image) {
        deleteImage(model.image);
      }
    });

    await tx.productModel.deleteMany({
      where: {
        product_id,
      },
    });

    const newModels = models.map((model, index) => {
      return {
        product_id: model.product_id,
        model_id: model.model_id,
        image: model.image ?? modelImages[index].image,
      };
    });

    const modelPromises = newModels.map(async (model) => {
      await tx.productModel.create({
        data: {
          ...model,
          product_id,
        },
      });
    });

    await Promise.all(modelPromises);

    return await tx.product.update({
      data: newRequest,
      where: {
        product_id,
      },
      select: {
        product_id: true,
        product_code: true,
        product_name: true,
        cost_price: true,
        selling_price: true,
        qr_code: true,
        product_model: {
          select: {
            model_id: true,
            image: true,
          },
        },
        modified_at: true,
      },
    });
  });
};

const remove = async (productId) => {
  productId = validate(getProductValidation, productId);

  const countProduct = await prismaClient.product.count({
    where: {
      product_id: productId,
    },
  });

  if (countProduct === 0) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  const countProductUsed = await prismaClient.transfer.count({
    where: {
      product_id: productId,
    },
  });

  if (countProductUsed > 0) {
    throw new ResponseError(400, "Product already used in transactions.");
  }

  const result = await prismaClient.product.delete({
    where: {
      product_id: productId,
    },
  });

  return result;
};

export default { create, search, get, update, remove };
