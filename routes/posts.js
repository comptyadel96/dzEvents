const express = require('express')
const router = express.Router()
const { Posts } = require('../models/posts')
const _ = require('lodash')
const multer = require('multer')
const sharp = require('sharp')
//middleware
const auth = require('../middlewares/auth')

// avoir la liste de tous les événements:
router.get('/', async (req, res) => {
  // pagination des événements :
  const page = parseInt(req.query.page)
  const limit = parseInt(req.query.limit)
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  //filtrer les événements:
  let categorie = {}
  // dans le cas ou on specifie une categorie dans l'url =>
  if (req.query.categorie) {
    categorie = req.query.categorie
    const posts = await Posts.find({ categorie })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('owner','-password -__v')
    res.status(200).send(posts)
  }
  // dans le cas ou on filtre pas la requéte =>
  const posts = await Posts.find()
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate('owner','-password -__v')

  res.status(200).send(posts)
})

// voir tous ses évènement (qu'on a nous méme creer)
router.get('/me/myevents', auth, async (req, res) => {
  try {
    let post = await Posts.find({ owner: req.user._id })
    if (!post) return res.status(404).send('aucun évènement trouvé')
    res.status(200).send(post)
  } catch (e) {
    console.log(e)
  }
})

// voir un seul  évènement  par son id:
router.get('/:id', async (req, res) => {
  const post = await Posts.findById(req.params.id)
  if (!post)
    return res.status(404).send('cet évènement n"a pas été trouvé désoler')
    res.status(200).send(post)
})

// ajouter un événement
router.post('/', auth, async (req, res) => {
  const { titre, categorie, dateDebut, dateFin,région,description,heureDebut,adresse,organisateur } = req.body
  let post = await Posts.create({
    titre,
    categorie,
    owner: req.user._id,
    région,
    adresse,
    organisateur,
    description,
    heureDebut,
    dateDebut,
    dateFin,
  })

  res
    .status(200)
    .send(post)
})

// configurer la photo pour l'evenement
const upload = multer({
  limits: {
    fileSize: 3000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(
        new Error(
          'le type de fichier doit étre une image de taille inférieure ou égale a 3MBs'
        )
      )
    }
    cb(undefined, true)
  },
})
// ajouter la photo pour l'événement
router.post( '/:id/picture',
  auth,
  upload.single('eventPic'),
  async (req, res) => {
    let post = await Posts.findOne({_id:req.params.id ,owner: req.user._id })
    const buffer = await sharp(req.file.buffer)
      .png()
      .resize({ width: 250, height: 250 })
      .toBuffer()
    post.image = buffer
    await post.save()
    res.send('photo télécharger avec succés')
  },
  (error, req, res, next) => {
    res.status(400).send({ erreur: error.message })
  }
)
// servir l'image au client  :
router.get('/:id/eventpicture', async (req, res) => {
  try {
    const post = await Posts.findById(req.params.id)
    if (!post || !post.image) {
      throw new Error()
    }
    res.set('Content-Type', 'image/png')
    res.send(post.image)
  } catch (e) {
    res.status(404)
  }
})
// supprimer l'image de l'evenement:
router.delete('/:id/eventpicture', auth, async (req, res) => {
  let post = await Posts.findOne({ owner: req.user._id, _id: req.params.id })
  if (!post.image) {
    res.status(404).send('aucune photo n a été  trouver pour ce événement')
  }
  post.image = undefined
  await post.save()
  res.send('la photo a bien été supprimer')
})

// modifier un événement
router.put('/:id', auth, async (req, res) => {
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
      if (!post) return res.status(400).send('une erreur est servenu!')
      await post.save()
      res
        .status(200)
        .send(
          _.pick(post, [
            'titre',
            'categorie',
            'dateDebut',
            'dateFin',
            'région',
            'description',
          ])
        )
    } catch (e) {
      res.status(404).send('error')
    }
  } else {
    res.status(403).send('vous pouvez pas modifier cet élément')
  }
})

// supprimer un évenement
router.delete('/:id', auth, async (req, res) => {
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
