import path, { dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import fs from "fs";

sharp.cache(false);

const __filename = fileURLToPath(import.meta.url);
const dirName = dirname(__filename);

export const tempDir = path.join(dirName, "../../public/temp");
export const productDir = path.join(dirName, "../../public/products");
export const qrcodeDir = path.join(dirName, "../../public/qrcodes");

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
if (!fs.existsSync(productDir)) fs.mkdirSync(productDir);
if (!fs.existsSync(qrcodeDir)) fs.mkdirSync(qrcodeDir);

export const compressImage = async (fileName) => {
  const fromPath = path.join(tempDir, fileName);
  const toPath = path.join(productDir, fileName);

  await sharp(fromPath).resize({ width: 400 }).toFile(toPath);
  fs.unlinkSync(fromPath);
};

export const deleteImage = (fileName) => {
  const pathImage = path.join(productDir, fileName);

  fs.unlinkSync(pathImage);
};
