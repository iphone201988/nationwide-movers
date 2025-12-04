import multer from "multer";
import fs from "fs";
import path from "path";

// Resolve uploads directory relative to project root (works in both dev and production)
// In dev: __dirname = src/middlewares, so ../../ = project root
// In prod: __dirname = dist/src/middlewares, so ../../ = dist, need one more level
const getProjectRoot = () => {
  // Check if we're in dist folder (production mode)
  if (__dirname.includes(path.join("dist", "src"))) {
    return path.join(__dirname, "../../../");
  }
  // Development mode
  return path.join(__dirname, "../../");
};

const dir = path.resolve(path.join(getProjectRoot(), "uploads"));
console.log("dir:::", dir);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

const upload = multer({ storage: storage });
export default upload;
