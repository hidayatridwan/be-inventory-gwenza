import modelService from "../service/model-service.js";

const create = async (req, res, next) => {
  try {
    const result = await modelService.create(req.user, req.body);

    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    const request = {
      page: req.query.page,
      size: req.query.size,
      model_name: req.query.model_name,
    };

    const result = await modelService.search(request);

    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const get = async (req, res, next) => {
  try {
    const modelId = req.params.modelId;

    const result = await modelService.get(modelId);

    res.status(200).json({
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    req.body.model_id = req.params.modelId;

    const result = await modelService.update(req.user, req.body);

    res.status(200).json({
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const modelId = req.params.modelId;

    await modelService.remove(modelId);
    res.status(204).json();
  } catch (e) {
    next(e);
  }
};

export default { create, search, get, update, remove };
