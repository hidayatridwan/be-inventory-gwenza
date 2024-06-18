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

const create = async (user, req) => {
  const product = validate(createProductValidation, req);
  product.created_by = user.username;

  return prismaClient.$transaction(async (tx) => {
    const countProduct = await tx.product.count();
    let productCode;
    if (countProduct > 0) {
      productCode = await generateProductCode();
    } else {
      productCode = "P00001";
    }
    product.product_code = productCode;

    const fileName = generateQRCode(productCode);
    product.qr_code = fileName;

    return await prismaClient.product.create({
      data: product,
      select: {
        product_id: true,
        product_code: true,
        product_name: true,
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
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  return result;
};

const update = async (user, req) => {
  req = validate(updateProductValidation, req);
  req.modified_by = user.username;
  req.modified_at = new Date().toISOString();

  const { product_id, ...newRequest } = req;

  const countProduct = await prismaClient.product.count({
    where: {
      product_id,
    },
  });

  if (countProduct === 0) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  const result = await prismaClient.product.update({
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
      modified_at: true,
    },
  });

  return result;
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
