import productService from "../service/product-service.js";
import { compressImage } from "../utils/tools.js";

const create = async (req, res, next) => {
  try {
    for (const image of req.files) {
      await compressImage(image.filename);
    }

    const models = req.body.model_id.map((id, index) => ({
      model_id: id,
      image: req.files[index].filename,
    }));
    req.body.models = models;

    const { model_id, ...newBody } = req.body;
    const result = await productService.create(req.user, newBody);

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
      product_code: req.query.product_code,
      product_name: req.query.product_name,
    };

    const result = await productService.search(request);

    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

const get = async (req, res, next) => {
  try {
    const productId = req.params.productId;

    const result = await productService.get(productId);

    res.status(200).json({
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    for (const image of req.files) {
      if (image.filename) {
        await compressImage(image.filename);
      }
    }

    const productId = req.params.productId;
    req.body.product_id = productId;
    const models = req.body.model_id.map((id, index) => ({
      product_id: productId,
      model_id: id,
      image: req.files[index]?.filename,
    }));
    req.body.models = models;

    const { model_id, image, ...newBody } = req.body;
    const result = await productService.update(req.user, newBody);

    res.status(200).json({ data: result });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const productId = req.params.productId;

    await productService.remove(productId);
    res.status(204).json();
  } catch (e) {
    next(e);
  }
};

export default { create, search, get, update, remove };
