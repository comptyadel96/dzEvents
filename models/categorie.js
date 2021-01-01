const mongoose = require('mongoose')

const categorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    minLength: 5,
    maxLength: 255,
    required:[ true,'vous devez choisir une catégorie !']
  },
})

const Categorie = mongoose.model('Categorie', categorieSchema)
module.exports = { Categorie, categorieSchema }
