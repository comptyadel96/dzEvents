const express = require('express')
const router = express.Router()
const { Categorie } = require('../models/categorie')
const admin = require('../middlewares/admin')
router.get('/', async (req, res) => {
  const categorie = await Categorie.find().populate('categorie')
  res.status(200).send(categorie)
})

router.get('/:id', async (req, res) => {
  const categorie = await Categorie.findById(req.params.id)
  await categorie.save()
  res.status(200).send(categorie)
})
router.post('/', admin, async (req, res) => {
  const categorie = await Categorie.create({ nom: req.body.nom })
  res.send(categorie)
})
router.put('/:id', admin, async (req, res) => {
  const categorie = await Categorie.findByIdAndUpdate(
    req.params.id,
    {
      nom: req.body.nom,
    },
    { runValidators: true, new: true }
  )
  await categorie.save()
  res.status(200).send(categorie.categories)
})

router.delete('/:id', admin, async (req, res) => {
  const categorie = await Categorie.findByIdAndDelete(req.params.id)
  res.status(200).redirect('/')
})
module.exports = router
