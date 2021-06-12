const multer = require("multer")
const upload = multer({
  limits: {
    fileSize: 5000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/gi)) {
      return cb(
        new Error(
          "le type de fichier doit étre une image de taille inférieure ou égale a 1.5MBs"
        )
      )
    }
    cb(undefined, true)
  },
})
const multerConfig = (req, res, next) => {
  if (!req.file) {
    upload.none()
    next()
  }
  if (req.file) {
    upload.single("firstTimePic")
    
  }
}
module.exports = { multerConfig }
