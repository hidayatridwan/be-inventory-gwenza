import { constants } from "../utils/constants.js";
import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import {
  createTailorValidation,
  getTailorValidation,
  searchTailorValidation,
  updateTailorValidation,
} from "../validation/tailor-validation.js";
import { validate } from "../validation/validation.js";

const create = async (user, req) => {
  const tailor = validate(createTailorValidation, req);
  tailor.created_by = user.username;

  const countTailor = await prismaClient.tailor.count({
    where: {
      tailor_name: tailor.tailor_name,
    },
  });

  if (countTailor > 0) {
    throw new ResponseError(400, constants.RECORD_EXISTS);
  }

  return await prismaClient.tailor.create({
    data: tailor,
    select: {
      tailor_id: true,
      tailor_name: true,
      created_at: true,
    },
  });
};

const search = async (req) => {
  req = validate(searchTailorValidation, req);

  const skip = (req.page - 1) * req.size;

  const filters = [];
  if (req.tailor_name) {
    filters.push({
      tailor_name: {
        contains: req.tailor_name,
      },
    });
  }

  const result = await prismaClient.tailor.findMany({
    where: {
      AND: filters,
    },
    take: req.size,
    skip: skip,
  });

  const totalItem = await prismaClient.tailor.count({
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

const get = async (tailorId) => {
  tailorId = validate(getTailorValidation, tailorId);

  const result = await prismaClient.tailor.findUnique({
    where: {
      tailor_id: tailorId,
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  return result;
};

const update = async (user, req) => {
  req = validate(updateTailorValidation, req);
  req.modified_by = user.username;

  const { tailor_id, ...newRequest } = req;

  const countTailor = await prismaClient.tailor.count({
    where: {
      tailor_id,
    },
  });

  if (countTailor === 0) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  const countTailorName = await prismaClient.tailor.count({
    where: {
      tailor_name: newRequest.tailor_name,
      NOT: {
        tailor_id,
      },
    },
  });

  if (countTailorName > 0) {
    throw new ResponseError(400, "Tailor name already exists.");
  }

  const result = await prismaClient.tailor.update({
    data: newRequest,
    where: {
      tailor_id,
    },
  });

  return result;
};

const remove = async (tailorId) => {
  tailorId = validate(getTailorValidation, tailorId);

  const countTailor = await prismaClient.tailor.count({
    where: {
      tailor_id: tailorId,
    },
  });

  if (countTailor === 0) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  const countTailorUsed = await prismaClient.product.count({
    where: {
      tailor_id: tailorId,
    },
  });

  if (countTailorUsed > 0) {
    throw new ResponseError(400, "Tailor already used in transactions.");
  }

  const result = await prismaClient.tailor.delete({
    where: {
      tailor_id: tailorId,
    },
  });

  return result;
};

export default { create, search, get, update, remove };
