const mongoose = require('mongoose')
const postSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      minLength: 6,
      maxLength: 255,
      trim: true,
      required: [true, 'vous devez attribuer un titre a l"evenement'],
    },
    categorie: {
      type: String,
      enum: [
        'Sportif',
        'Commercial',
        'Religieux',
        'High-Tech',
        'Musicale',
        'Concours',
        'Conférence',
        'Trip-voyage et sorties',
        'Culturele',
        'Recrutement proffessionel',
        'fétes'
      ],
      required: [true, 'vous devez specifier une catégorie'],
    },
    région: {
      type: String,
      minlength: 2,
    },
    image: String,
    description: {
      type: String,
      maxLength: 1024,
    },
    dateDebut: {
      type: Date,
      required: [
        true,
        'vous devez définir une date de début pour cet évenement ',
      ],
    },
    dateFin: {
      type: Date,
      required: [
        true,
        'vous devez définir une date de fin pour cet évenement ',
      ],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)


const Posts = mongoose.model('Post', postSchema)

module.exports = { Posts, postSchema }
