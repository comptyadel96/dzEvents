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
        'Fétes',
        'Artistique'
      ],
      required: [true, 'vous devez specifier une catégorie'],
    },
    région: {
      type: String,
      minlength: 2,
      required:[true,'vous devez spécifier la région pour cet évènement']
    },
    adresse:{
    type:String,
    minlength:10,
    maxlength:1024,
    required:[true,'vous devez spécifier l adresse pour cet évènement']
    },
    organisateur:{
      type:String,
      minlength:3,
      maxlength:1024
    },
    image: Buffer,
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
      min:[new Date().toDateString(),'la date doit étre égal ou supérieure a la date actuel']
    },
    dateFin: {
      type: Date,
      min:[new Date(Date.now()+1000*60*60*24).toDateString() ,'la date de fin doit étre supérieure a la date du début']
    },
    heureDebut:{
      type:Date,
      // required:[true,'vous devez définir une heure de début pour cet évènement']
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
