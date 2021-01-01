const mongoose = require('mongoose')
const Joi = require('joi')

const storeSchema = new mongoose.Schema({
  article: {
    type: String,
    minlength: 5,
    maxlength: 1024,
    required: [true, 'veuillez donner un titre à votre article ou service!'],
    trim: true,
  },
  prix: {
    type: String,
    minlength: 4,
    maxlength: 1024,
    required: [true, 'veuillez défénir un prix à votre article ou service !'],
  },
  image: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
})
const validateArticle = (article) => {
  const schema = Joi.object({
    article: Joi.string().min(5).max(1024).required(),
    prix: Joi.string().min(4).max(1024).required(),
    image: Joi.string(),
    owner: Joi.object().required(),
  })

  return schema.validate(article)
}
const Store = mongoose.model('Store', storeSchema)
module.exports = { Store, validateArticle }
