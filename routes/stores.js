const express = require("express")
const router = express.Router()
const { Store } = require("../models/store")
const DatauriParser = require("datauri/parser")
const multer = require("multer")
const path = require("path")
const sharp = require("sharp")
const Photos = require("../models/photo")
// middleware
const auth = require("../middlewares/auth")
const { uploader } = require("../middlewares/cloudinaryConfig")

// voir tous les articles dans le store:
router.get("/", async (req, res) => {
  // pagination  et filtrage ....
  const page = parseInt(req.query.page)
  const limit = parseInt(req.query.limit)
  const startIndex = (page - 1) * limit
  //faire une recherche dans le store(barre de recherche front- end)
  if (req.query.searchItem) {
    const storeArticle = await Store.find({
      $text: { $search: req.query.searchItem },
    })
      .sort({ createdAt: -1 })
      .populate("owner", " -password -__v")
      .populate("photos", "url _id ")
    if (!storeArticle) return res.status(404).send("aucun article trouvé dsl")

    return res.status(200).send(storeArticle)
  } else {
    const article = await Store.find()
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("owner", " -password -profilePicture")
      .populate("photos", "url _id ")
    return res.status(200).send(article)
  }
})
// trouver un article par son id :
router.get("/:id", async (req, res) => {
  const article = await Store.findById(req.params.id)
    .populate("owner", "-password -profilePicture -__v ")
    .populate("photos", "url _id")
  if (!article)
    return res
      .status(404)
      .send("aucun article trouvé assurez vous de bien saisir votre recherche")
  res.status(200).send(article)
})
// trouver les articles qu'on a nous meme publier
router.get("/me/stores", auth, async (req, res) => {
  const article = await Store.find({ owner: req.user._id })
    .populate("owner", "-password -__v")
    .populate("photos", "url _id")
  if (!article) return res.status(404).send("aucun article trouvé")
  res.status(200).send(article)
})

const upload = multer({
  limits: {
    fileSize: 5000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/gi)) {
      return cb(
        new Error(
          "le type de fichier doit étre une image de taille inférieure ou égale a 5MBs "
        )
      )
    }
    cb(undefined, true)
  },
}).array("storePics", 5)

// creer un nouvel article à vendre:
router.post("/", auth, upload, async (req, res) => {
  let article = await Store.create({
    article: req.body.article,
    prix: req.body.prix,
    wilaya: req.body.wilaya,
    description: req.body.description,
    owner: req.user._id,
  })

  if (req.files) {
    try {
      await Promise.all(
        req.files.map(async (file) => {
          const buffer = await sharp(file.buffer)
            .resize({ height: 350, width: 350 })
            .png()
            .toBuffer()
          // convertir le buffer en lien
          const parser = new DatauriParser()
          const files = parser.format(
            path.extname(file.originalname).toString(),
            buffer
          ).content

          await uploader
            .upload(files.toString())
            .then(async (result, error) => {
              if (error) {
                console.log(error)
              }

              if (article.photos.length < 5) {
                const photo = await Photos.create({ url: result.url })
                await article.photos.push(photo)
                await article.save()
                res.status(200).send("photos telecharger avec succes")
              } else {
                res.status(400).send("pas plus de 5 photos svp").end()
              }
            })
        })
      )
    } catch (e) {
      console.log(e)
    }
  }
  !req.files && res.status(200).send(article)
})

// ajouter d'autre photos aprés la création de l'article dans le store (si jamais l'utilisateur voudrait modifier ou ajouter des photos)
router.patch("/:id/pictures", [auth, upload], async (req, res) => {
  let article = await Store.findOne({ _id: req.params.id, owner: req.user._id })
  if (req.files) {
    await Promise.all(
      req.files.map(async (file) => {
        const buffer = await sharp(file.buffer)
          .resize({ height: 350, width: 350 })
          .png()
          .toBuffer()
        // convertir le buffer en lien
        const parser = new DatauriParser()
        const files = parser.format(
          path.extname(file.originalname).toString(),
          buffer
        ).content

        await uploader.upload(files.toString()).then(async (result) => {
          if (article.photos.length < 5) {
            const photo = await Photos.create({ url: result.url })
            await article.photos.push(photo)
            return res.status(200).send("photos telecharger avec succes")
          } else {
            return res.send("pas plus de 5 photos svp")
          }
        })
      })
    )
  } else {
    return res.status(400).send("vous devez aumoins télécharger une image")
  }
})

// modifier un article dans le store
router.put("/:id", upload, auth, async (req, res) => {
  const _id = req.params.id
  if (!req.body.owner || !req.body._id) {
    let article = await Store.findOneAndUpdate(
      { _id, owner: req.user._id },
      {
        ...req.body,
      },
      { runValidators: true, new: true }
    )
    if (!article)
      return res.status(403).send("vous n'étes pas autorisé à faire cet action")
    await article.save()
    res.status(200).send("article modifer avec succée")
  }
})
// supprimer un article du store
router.delete("/:id", auth, async (req, res) => {
  const _id = req.params.id
  const article = Store.findOneAndDelete({ _id, owner: req.user._id })
  if (!article) return res.status(404).send("cet article n est plus disponible")
  res.sendStatus(200)
})

// supprimer l'image
router.delete("/storepictures/:id/:photoId", auth, async (req, res) => {
  const article = await Store.findOne({
    _id: req.params.id,
    owner: req.user._id,
  })
  if (!article)
    return res
      .status(404)
      .send("aucun image trouver!,il se peut qu'elle soit déja été supprimer ")
  await Photos.findByIdAndDelete(req.params.photoId)
  // avoir le _id de la photo
  let tof = article.photos.find((p) => p == req.params.photoId)
  // recuperer l'index de la photo du tableau
  let index = article.photos.indexOf(tof)
  // utiliser la méthode splice pour supprimer la photo du tableau avec le _id approprié
  article.photos.splice(index, 1)
  await article.save()

  res.status(200).send("photo supprimer du store avec succées!")
})

module.exports = router
