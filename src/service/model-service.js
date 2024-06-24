import { constants } from "../utils/constants.js";
import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import {
  createModelValidation,
  getModelValidation,
  searchModelValidation,
  updateModelValidation,
} from "../validation/model-validation.js";
import { validate } from "../validation/validation.js";
import { getDate } from "../utils/tools.js";

const create = async (user, req) => {
  const model = validate(createModelValidation, req);
  model.created_at = getDate();
  model.created_by = user.username;

  const countModel = await prismaClient.model.count({
    where: {
      model_name: model.model_name,
    },
  });

  if (countModel > 0) {
    throw new ResponseError(400, constants.RECORD_EXISTS);
  }

  return await prismaClient.model.create({
    data: model,
    select: {
      model_id: true,
      model_name: true,
      created_at: true,
    },
  });
};

const search = async (req) => {
  req = validate(searchModelValidation, req);

  const skip = (req.page - 1) * req.size;

  const filters = [];
  if (req.model_name) {
    filters.push({
      model_name: {
        contains: req.model_name,
      },
    });
  }

  const result = await prismaClient.model.findMany({
    where: {
      AND: filters,
    },
    select: {
      model_id: true,
      model_name: true,
    },
    take: req.size,
    skip: skip,
  });

  const totalItem = await prismaClient.model.count({
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

const get = async (modelId) => {
  modelId = validate(getModelValidation, modelId);

  const result = await prismaClient.model.findUnique({
    where: {
      model_id: modelId,
    },
    select: {
      model_id: true,
      model_name: true,
    },
  });

  if (!result) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  return result;
};

const update = async (user, req) => {
  req = validate(updateModelValidation, req);
  req.modified_at = getDate();
  req.modified_by = user.username;

  const { model_id, ...newRequest } = req;

  const countModel = await prismaClient.model.count({
    where: {
      model_id,
    },
  });

  if (countModel === 0) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  const countModelName = await prismaClient.model.count({
    where: {
      model_name: newRequest.model_name,
      NOT: {
        model_id,
      },
    },
  });

  if (countModelName > 0) {
    throw new ResponseError(400, "Model name already exists.");
  }

  const result = await prismaClient.model.update({
    data: newRequest,
    where: {
      model_id,
    },
    select: {
      model_id: true,
      model_name: true,
      modified_at: true,
    },
  });

  return result;
};

const remove = async (modelId) => {
  modelId = validate(getModelValidation, modelId);

  const countModel = await prismaClient.model.count({
    where: {
      model_id: modelId,
    },
  });

  if (countModel === 0) {
    throw new ResponseError(404, constants.NOT_FOUND);
  }

  const countModelUsed = await prismaClient.product.count({
    where: {
      model_id: modelId,
    },
  });

  if (countModelUsed > 0) {
    throw new ResponseError(400, "Model already used in transactions.");
  }

  const result = await prismaClient.model.delete({
    where: {
      model_id: modelId,
    },
  });

  return result;
};

export default { create, search, get, update, remove };
