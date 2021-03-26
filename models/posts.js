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
        'Etudiants',
        'High-Tech',
        'Musicale',
        'Concours',
        'Conférence',
        'Trip-voyage et sorties',
        'Culturelle',
        'Recrutement proffessionel',
        'Fétes',
        'Loisir',
        'Artistique',
        'Autre',
      ],
      required: [true, 'vous devez specifier une catégorie'],
    },
    region: {
      type: String,
      minlength: 2,
      required: [true, 'vous devez spécifier la région pour cet évènement'],
    },
    adresse: {
      type: String,
      minlength: 10,
      maxlength: 1024,
      required: [true, 'vous devez spécifier l adresse pour cet évènement'],
    },
    image: String,
    description: {
      type: String,
      maxLength: 1024,
    },
    dateDebut: {
      type: Date,
      // required: [true, 'vous devez définir une date de début pour cet évenement '],
      min: [new Date(Date.now() + 1000 * 60 * 5), 'la date doit étre égal ou supérieure a la date actuel'],
    },
    dateFin: {
      type: Date,
      min: [new Date(Date.now() + 1000 * 60 * 60).toDateString(), 'la date de fin doit étre supérieure a la date du début'],
    },
    geometry: {
      type: {
        type: String,
        default: 'Point',
      },
      coordinates: [Number],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true,
    },
    status: {
      type: String,
      enum: ['en cours', 'terminé', 'à venir'],
    },
  },
  { timestamps: true }
)

postSchema.methods.getStatus=function(){
  if (this.dateFin < Date.now()) {
    this.status = 'terminé'
  }else if (this.dateDebut>=Date.now()&&this.dateFin<Date.now()){
    this.status = 'en cours'
  }else{
    this.status='à venir'
  }
}


postSchema.index({ titre: 'text' })

const Posts = mongoose.model('Post', postSchema)

module.exports = { Posts, postSchema }
