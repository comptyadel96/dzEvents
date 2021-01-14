const mongoose = require('mongoose')
const Joi = require('joi')

const storeSchema = new mongoose.Schema(
  {
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
      maxlength: 100,
      required: [true, 'veuillez défénir un prix à votre article ou service !'],
    },
    wilaya: {
      type: String,
      minlength: 2,
      maxlength: 100,
      required: [true, 'vous devez spécifiez votre  wilaya'],
    },
    description: {
      type: String,
      minlength: 10,
      maxlength: 2200,
    },
    photo: {
      type:Buffer
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)
const validateArticle = (article) => {
  const schema = Joi.object({
    article: Joi.string().min(5).max(1024).required(),
    prix: Joi.string().min(4).max(1024).required(),
    description: Joi.string().min(10),
    wilaya: Joi.string().min(2).max(100),
  })

  return schema.validate(article)
}
const Store = mongoose.model('Store', storeSchema)
module.exports = { Store, validateArticle }
