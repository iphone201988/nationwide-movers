import multer from "multer";
import fs from "fs";
import path from "path";

const dir = path.resolve(path.join(__dirname, "../../src/uploads"));
console.log("dir:::", dir);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
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
