const express = require('express')
const router = express.Router()
const { User, validateSchema } = require('../models/user.js')
const admin = require('../middlewares/admin')

// trouver tous les utilisateur
router.get('/', admin, async (req, res) => {
  const user = await User.find()
  res.status(200).send(user)
})
// trouver un seul utilisateur
router.get('/:id', admin, async (req, res) => {
  const user = await User.findById(req.params.id)
  res.status(200).send(user)
  if (!user) return res.status(404).send('aucun utilisateur trouver')
})
// creer un nouvel utilisateur
router.post('/', admin, async (req, res) => {
  const { error } = await validateSchema(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  const user = await User.create(req.body)
  res.status(201).send(user)
})
// supprimer un utilisateur
router.delete('/:id', admin, async (req, res) => {
  await User.findByIdAndDelete(req.body.id)
  res.status(200).send('cet utilisateur a bien été supprimer !')
})

module.exports = router
