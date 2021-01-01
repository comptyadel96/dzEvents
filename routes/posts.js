const express = require('express')
const router = express.Router()
const { Posts } = require('../models/posts')
const _ = require('lodash')
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
      .populate('owner', 'name -_id')
    res.status(200).send(posts)
  }
  // dans le cas ou on filtre pas la requéte =>
  const posts = await Posts.find()
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate('owner', 'name -_id')

  res.status(200).send(posts)
})

// voir un seul evenement
router.get('/:id', auth, async (req, res) => {
  const _id = req.params.id
  try {
    let post = await Posts.findOne({ _id, owner: req.user._id })
    if (!post)
      return res
        .status(403)
        .send('vous n" etes pas le propriétaire de cet evenement')
    res.status(200).send(post)
  } catch (e) {
    console.log(e)
  }
})
// ajouter un événement
router.post('/', auth, async (req, res) => {
  const { titre, categorie, dateDebut, dateFin } = req.body
  let post = await Posts.create({
    titre,
    categorie,
    owner: req.user._id, // Tricky tricky ......lol
    dateDebut,
    dateFin,
  })

  res.status(200).send(_.pick(post,['titre','categorie','owner','dateDebut','dateFin']))
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
