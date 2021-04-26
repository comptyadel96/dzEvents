const mongoose = require('mongoose')

const firstTimeSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      minlength: 6,
      maxlength: 1024,
      required: [true, 'veuillez svp indiquer un titre à votre premier évènement! '],
      trim: true,
    },
    wilaya: {
      type: String,
      minlength: 2,
      maxlength: 100,
      required: [true, 'vous devez entrer le nom ou le numéro de la wilaya'],
    },
    adresse: {
      type: String,
      maxlength: 1024,
    },
    description: {
      type: String,
      maxlength: 1024,
    },
    photo: {
      type: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true,
    },
  },
  { timestamps: true }
)

const FirstTime = mongoose.model('FirstTime', firstTimeSchema)
module.exports = FirstTime
