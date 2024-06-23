import qr from "qrcode";
import path from "path";
import { qrcodeDir } from "./tools.js";
import { v4 as uuid } from "uuid";

export const generateProductCode = async (tx) => {
  const latestProduct = await tx.product.findFirst({
    orderBy: {
      product_id: "desc",
    },
    select: {
      product_code: true,
    },
  });

  let newProductCode = "P00001";

  if (latestProduct?.product_code) {
    const latestCodeNum = parseInt(latestProduct.product_code.slice(1)) + 1;
    newProductCode = `P${latestCodeNum.toString().padStart(5, "0")}`;
  }

  return newProductCode;
};

export const generateQRCode = (productCode) => {
  const fileName = `${uuid().toString()}.png`;
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
