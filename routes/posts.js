const express = require("express")
const router = express.Router()
const { Posts } = require("../models/posts")
const _ = require("lodash")
const multer = require("multer")
const sharp = require("sharp")
const path = require("path")
const { uploader } = require("../middlewares/cloudinaryConfig")
const DatauriParser = require("datauri/parser")
//middleware
const auth = require("../middlewares/auth")

// avoir la liste de tous les événements:
router.get("/", async (req, res) => {
  // supprimer un évènement apres 6 mois de sa date de fin (90jours)
  await Posts.deleteMany({
    dateFin: { $lte: Date.now() - 1000 * 60 * 60 * 24 * 180 },
  })

  // pagination des événements :
  const page = parseInt(req.query.page)
  const limit = parseInt(req.query.limit)
  const startIndex = (page - 1) * limit

  //filtrer les événements:
  let categorie = {}
  // dans le cas ou on specifie une categorie dans l'url =>
  if (req.query.categorie) {
    categorie = req.query.categorie
    const posts = await Posts.find({ categorie })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate("owner", "-password -__v")
    // avoir le status de l'évènement (en cours ,terminé ou bientot)
    // await posts.getStatus()
    return res.status(200).send(posts)
  }

  // faire la recherche dans le store (front end barre de recherche)
  if (req.query.searchEvent) {
    const post = await Posts.find({ $text: { $search: req.query.searchEvent } })
      .sort({ createdAt: -1 })
      .populate("owner", "-password -__v")
    if (!post) return res.status(404).send("aucun evenement trouver")
    return res.status(200).send(post)
  }

  // dans le cas ou on filtre pas la requéte =>
  const posts = await Posts.find()
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate("owner", "-password -__v")
  res.status(200).send(posts)
})

// voir tous ses évènement (qu'on a nous méme creer)
router.get("/me/myevents", auth, async (req, res) => {
  try {
    let post = await Posts.find({ owner: req.user._id })
    if (!post) return res.status(404).send("aucun évènement trouvé")
    res.status(200).send(post)
  } catch (e) {
    console.log(e)
  }
})

// voir un seul  évènement  par son id:
router.get("/:id", async (req, res) => {
  const post = await Posts.findById(req.params.id)
  await post.getStatus()
  if (!post)
    return res.status(404).send('cet évènement n"a pas été trouvé désoler')
  res.status(200).send(post)
})

const upload = multer({
  limits: {
    fileSize: 3000000,
  },

  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(
        new Error(
          "le type de fichier doit étre une image de taille inférieure ou égale a 3MBs"
        )
      )
    }
    cb(undefined, true)
  },
}).single("eventPic")

// ajouter un événement
router.post("/", upload, async (req, res) => {
  // auth, raja3ha
  const {
    titre,
    categorie,
    dateDebut,
    dateFin,
    region,
    description,
    heureDebut,
    adresse,
    organisateur,
    geometry,
  } = req.body
  let post = await Posts.create({
    titre,
    categorie,
    geometry,
    // owner: req.user._id,
    region,
    adresse,
    organisateur,
    description,
    heureDebut,
    dateDebut,
    dateFin,
  })
  console.log(post)
  if (req.file) {
    const buffer = await sharp(req.file.buffer)
      .resize({ height: 350, width: 350 })
      .png()
      .toBuffer()
    // convertir le buffer en lien
    const parser = new DatauriParser()
    const file = parser.format(
      path.extname(req.file.originalname).toString(),
      buffer
    ).content
    await uploader.upload(file.toString()).then(async (result, error) => {
      if (error) {
        console.log(error)
      }
      post.image = result.url
      await post.save()
      return res.status(200).send("photo telecharger avec succeés")
    })
  } else {
    return res.status(200).send(post)
  }
})

// supprimer l'image de l'evenement:
router.delete("/:id/eventpicture", auth, async (req, res) => {
  let post = await Posts.findOne({ owner: req.user._id, _id: req.params.id })
  if (!post.image) {
    res.status(404).send("aucune photo n a été  trouver pour ce événement")
  }
  post.image = undefined
  await post.save()
  res.send("la photo a bien été supprimer")
})

// modifier un événement
router.put("/:id", auth, async (req, res) => {
  const _id = req.params.id
  // on s'assure que l'utilisateur ne peut pas modifer le _id et le owner dans la bdd
  if (!req.body.owner || !req.body._id) {
    try {
      const post = await Posts.findOneAndUpdate(
        { _id, owner: req.user._id },

        { ...req.body },

        {
          runValidators: true,
          new: true,
        }
      )
      if (!post) return res.status(400).send("une erreur est servenu!")
      await post.save()
      res
        .status(200)
        .send(
          _.pick(post, [
            "titre",
            "categorie",
            "dateDebut",
            "dateFin",
            "region",
            "description",
          ])
        )
    } catch (e) {
      res.status(404).send("error")
    }
  } else {
    res.status(403).send("vous pouvez pas modifier cet élément")
  }
})

// supprimer un évenement
router.delete("/:id", auth, async (req, res) => {
  const _id = req.params.id
  try {
    const post = await Posts.findOneAndDelete({ _id, owner: req.user._id })
    if (!post)
      return res
        .status(404)
        .send('vous n"étes pas autoriser a faire cet action')
    res.status(200).send(post)
  } catch (e) {
    console.log(e)
  }
})

module.exports = router
