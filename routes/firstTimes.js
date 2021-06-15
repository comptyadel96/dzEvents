const express = require("express")
const router = express.Router()
const multer = require("multer")
const sharp = require("sharp")
const path = require("path")
const FirstTime = require("../models/firstTime")
const { User } = require("../models/user")
const auth = require("../middlewares/auth")
const DatauriParser = require("datauri/parser")
const { uploader } = require("../middlewares/cloudinaryConfig")

// voir tous les events de la premiere fois :
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page)
  const limit = parseInt(req.query.limit)
  const startIndex = (page - 1) * limit
  const first = await FirstTime.find()
    .skip(startIndex)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate("owner", "-password ")
  res.status(200).send(first)
})

// first event avec l'identificateur :
router.get("/:id", async (req, res) => {
  try {
    const first = await FirstTime.findById(req.params.id).populate(
      "owner",
      "-password"
    )
    res.status(200).send(first)
  } catch (e) {
    res.status(404).send("aucun évènement trouver désolé ")
  }
})

// voir son propre first event
router.get("/me/firstevent", auth, async (req, res) => {
  const first = await FirstTime.findOne({ owner: req.user._id }).populate(
    "owner",
    "-password -__v"
  )
  if (!first) return res.status(404).send("aucun élément trouver")
  res.status(200).send(first)
})
// configurer la photo pour le firsttime
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

// ajouter un first event
router.post("/", auth, upload.single("firstTimePic"), async (req, res) => {
  const user = await User.findOne({ _id: req.user._id })
  // verifier si l'utilisateur n'a pas encore publier dans la section (1 iére fois)
  if (!user.firstTimePublished) {
    const first = await FirstTime.create({
      titre: req.body.titre,
      description: req.body.description,
      adresse: req.body.adresse,
      wilaya: req.body.wilaya,
      owner: req.user._id,
    })
    console.log(req.file);
    if (req.file) {
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 350, height: 300 })
        .png()
        .toBuffer()
      // convertir le buffer en string(base64)
      const parser = new DatauriParser()
      const file = parser.format(
        path.extname(req.file.originalname).toString(),
        buffer
      ).content

      await uploader.upload(file).then(async (result) => {
        const imageUri = result.url
        first.photo = imageUri
        await first.save()
        res.send("photo télécharger avec succés")
      })
    }

    // appliquer la methode pour que l'utilisateur ne puisse pas poster plus qu'un article
    await user.hasPublished()
    await user.save()
    res.status(200).send(first)
  } else {
    res
      .status(403)
      .send(
        "vous avez le droit a une seule publication dans la section premiére fois"
      )
  }
})

// modifier first event
router.put("/:id", auth, upload.single("firstTimePic"), async (req, res) => {
  const _id = req.params.id
  if (!req.body.owner || !req.body._id) {
    const first = await FirstTime.findOneAndUpdate(
      { _id, owner: req.user._id },
      { ...req.body },
      { runValidators: true, new: true }
    )

    if (req.file) {
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 350, height: 300 })
        .png()
        .toBuffer()
      // convertir le buffer en string(base64)
      const parser = new DatauriParser()
      const file = parser.format(
        path.extname(req.file.originalname).toString(),
        buffer
      ).content

      await uploader.upload(file).then(async (result) => {
        const imageUri = result.url
        first.photo = imageUri
        await first.save()
        res.send("photo télécharger avec succés")
      })
    }

    if (!first) {
      return res.status(404).send(" oops ! cet élèment est introuvable :( ")
    }

    await first.save()
    res.status(200).send(first)
  } else {
    res.status(403).send("vous n avez pas le droit de modifier cet élément")
  }
})

// supprimer un first event :
router.delete("/:id", auth, async (req, res) => {
  const _id = req.params.id
  const first = await FirstTime.findOneAndDelete({ _id, owner: req.user._id })
  if (!first)
    return res
      .status(404)
      .send("cet évènement est introuvable ou bien a déja été  supprimer")
  res.status(200).send("event supprimer avec succées !")
})

// supprimer la photo du firstTime
router.delete("/:id/picture", auth, async (req, res) => {
  const first = await FirstTime.findOne({
    _id: req.params.id,
    owner: req.user._id,
  })
  if (!first || !first.photo) {
    return res.status(404).send("aucune photo trouvé ")
  }
  first.photo = undefined
  res.status(200)
})

module.exports = router
