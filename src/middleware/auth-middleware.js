import Jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  const token = req.get("Authorization");
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" }).end();
  }

  try {
    const decoded = Jwt.verify(token, process.env.PRIVATE_KEY);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ message: "Invalid token" }).end();
  }
};

export { authMiddleware };
