const express = require('express')
const router = express.Router()
const { Store, validateArticle } = require('../models/store')
const auth = require('../middlewares/auth')
const multer = require('multer')

// voir tous les articles dans le store:
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page)
  const limit = parseInt(req.query.limit)
  let startIndex = (page - 1) * limit

  const article = await Store.find().skip(startIndex).limit(limit).populate('owner', '-_id')
  res.status(200).send(article)
})
// trouver un article par son id :
router.get('/:id', async (req, res) => {
  const article = await Store.findById(req.params.id)
  if (!article) return res.status(404).send('aucun article trouvé assurez vous de bien saisir votre recherche')
  res.status(200).send(article)
})
// creer un nouvel article à vendre:
router.post('/', auth, async (req, res) => {
  const { error } = await validateArticle(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  const article = await Store.create({
    article: req.body.article,
    prix: req.body.prix,
    image: req.body.image,
    owner: req.user._id,
  })
  res.status(200).send(article)
})
// modifier un article dans le store
router.put('/:id', auth, async (req, res) => {
  const _id = req.params.id
  if (!req.body.owner || !req.body._id) {
    let article = await Store.findOneAndUpdate(
      { _id, owner: req.user._id },
      {
        ...req.body,
      },
      { runValidators: true, new: true }
    )
    if (!article) return res.status(403).send("vous n'étes pas autorisé à faire cet action")
    await article.save()
  }
})
// supprimer un article du store
router.delete('/:id', auth, async (req, res) => {
  const _id = req.params.id
  const article = Store.findOneAndDelete({ _id, owner: req.user._id })
  if (!article) return res.status(404).send('cet article n est plus disponible')
  res.sendStatus(200)
})

// configurer les photos pour le store
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../public/storePictures')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  },
})
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/gi)) {
      return cb(new Error('le type de fichier doit étre une image de taille inférieure ou égale a 2MBs '))
    }
    cb(undefined, true)
  },
})

module.exports = router
