const express = require('express')
const router = express.Router()
const multer = require('multer')
const sharp = require('sharp')
const { FirstTime } = require('../models/firstTime')
const { User } = require('../models/user')
const auth = require('../middlewares/auth')

// voir tous les events de la premiere fois :
router.get('/', async (req, res) => {
  const first = await FirstTime.find()
    .sort({ createdAt: -1 })
    .populate('owner', '-password')
  res.status(200).send(first)
})

// first event avec l'identificateur :
router.get('/:id', async () => {
  try {
    const first = await FirstTime.findById(req.params.id)
    res.status(200).send(first)
  } catch (e) {
    res.status(404).send('aucun évènement trouver désolé ')
  }
})
// voir son propre first event
router.get('/me/firstevent', auth, async (req, res) => {
  const first = await FirstTime.findOne({ owner: req.user._id })
  if (!first) return res.status(404).send('aucun élément trouver')
  res.status(200).send(first)
})
// ajouter un first event
router.post('/', auth, async (req, res) => {
  const user = await User.findOne({ _id: req.user._id })
  if (!user.firstTimePublished) {
    try {
      const first = await FirstTime.create({
        titre: req.body.titre,
        description: req.body.description,
        wilaya: req.body.wilaya,
        owner: req.user._id,
      })
      // appliquer la methode pour que l'utilisateur ne puisse pas poster plus qu'un article
      await user.hasPublished()
      await user.save()

      if (!first)
        return res
          .status(400)
          .send('vous devez remplir tous les champs obligatoire')
      res.status(200).send(first)
    } catch (e) {
      res.status(403).send('un probléme est servenu ')
    }
  } else {
    res
      .status(403)
      .send(
        'vous avez le droit a une seule publication dans la section premiére fois'
      )
  }
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
// ajouter la photo pour le first time 
router.post(
  '/:id/picture',
  auth,
  upload.single('firstTimePic'),
  async (req, res) => {
    let first = await FirstTime.findOne({
      _id: req.params.id,
      owner: req.user._id,
    })
    const buffer = await sharp(req.file.buffer)
      .png()
      .resize({ width: 250, height: 250 })
      .toBuffer()
    first.photo = buffer
    await first.save()
    res.send('photo télécharger avec succés')
  },
  (error, req, res, next) => {
    res.status(400).send({ erreur: error.message })
  }
)
//servir la photo au client
router.get('/:id/picture', async (req, res) => {
  try {
    const first = await FirstTime.findById(req.params.id)
    if (!first || !first.photo) {
      throw new Error()
    }
    res.set('Content-Type', 'image/png')
    res.send(first.photo)
  } catch (e) {
    res.status(404)
  }
})

// modifier first event
router.put('/:id', auth, async (req, res) => {
  const _id = req.params.id
  if (!req.body.owner || !req.body._id) {
    const first = await FirstTime.findOneAndUpdate(
      { _id, owner: req.user._id },
      { ...req.body },
      { runValidators: true, new: true }
    )
    if (!first)
      return res.status(404).send(' oops ! cet élèment est introuvable :( ')
    await first.save()
    res.status(200).send(first)
  } else {
    res.status(403).send('vous n avez pas le droit de modifier cet élément')
  }
})

// supprimer un first event :
router.delete('/:id', auth, async (req, res) => {
  const _id = req.params.id
  const first = await FirstTime.findOneAndDelete({ _id, owner: req.user._id })
  if (!first)
    return res
      .status(404)
      .send('cet évènement est introuvable ou bien a déja été  supprimer')
  res.status(200).send('event supprimer avec succées !')
})

module.exports = router
