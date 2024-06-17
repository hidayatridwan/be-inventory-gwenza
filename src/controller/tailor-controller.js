import tailorService from "../service/tailor-service.js";

const create = async (req, res, next) => {
  try {
    const result = await tailorService.create(req.user, req.body);

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
      tailor_name: req.query.tailor_name,
    };

    const result = await tailorService.search(request);

    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const get = async (req, res, next) => {
  try {
    const tailorId = req.params.tailorId;

    const result = await tailorService.get(tailorId);

    res.status(200).json({
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    req.body.tailor_id = req.params.tailorId;

    const result = await tailorService.update(req.user, req.body);

    res.status(200).json({
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const tailorId = req.params.tailorId;

    await tailorService.remove(tailorId);
    res.status(204).json();
  } catch (e) {
    next(e);
  }
};

export default { create, search, get, update, remove };
