import { prismaClient } from "../application/database.js";
import qr from "qrcode";
import path from "path";
import { qrcodeDir } from "./tools.js";

export const generateProductCode = async () => {
  const productCodeQuery = await prismaClient.$queryRaw`SELECT
          CONCAT('P',
                  LPAD(RIGHT(product_code, 5) + 1, 5, 0)) AS product_code
      FROM
          product
      ORDER BY product_id DESC
      LIMIT 1
      FOR UPDATE`;
  return productCodeQuery[0].product_code;
};

export const generateQRCode = (productCode) => {
  const fileName = `${Date.now()}.png`;
  const filePath = path.join(qrcodeDir, fileName);

  qr.toFile(
    filePath,
    productCode,
    {
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    },
    (err) => {
      if (err) {
        throw new ResponseError(400, err);
      }
    }
  );

  return fileName;
};
