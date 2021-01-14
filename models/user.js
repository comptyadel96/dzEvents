const mongoose = require('mongoose')
const Joi = require('joi')
const passwordComplexity = require('joi-password-complexity').default
const validator = require('validator')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const { Buffer } = require('buffer')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 4,
    maxLength: 50,
    required: [true, 'veuillez entrer un nom svp!!'],
    trim: true,
  },
  email: {
    type: String,
    validate(val) {
      if (!validator.isEmail(val)) {
        throw new Error('email invalide ...réessayez  ')
      }
    },
    required: true,
    minLength: 10,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
    maxLength: 1024,
    trim: true,
  },
  phoneNumber: {
    type: String,
    // required: [
    //   true,
    //   'veuillez entrer votre numéro de téléphone professionnel s il vous plait ',
    // ],
    maxLength: 100,
    minLength: 10,
    unique: [
      true,
      'le numéro de téléphone doit étre unique pour chaque utilisateur',
    ],
  },
  profilePicture: {
    type: Buffer,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  firstTimePublished: {
    type: Boolean,
    default: false,
  },
})

// hasher le mot de passe avant de l'enregistrer :
userSchema.pre('save', async function (next) {
  // si le mot de passe n'a pas été modifier (mot de passe oublié ou  bien mot de passe changer par l'utilisateur)
  // alors on saute l'étape de hashage avec next ()
  if (!this.isModified('password')) {
    return next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// methode pour creer un ticket jwt
userSchema.methods.createTokenAuth = async function () {
  const token = await jwt.sign({ _id: this._id }, process.env.JWT_TOKEN_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  })
  return token
}

// methode pour generer un ticket en cas ou on oublie le mot de passe :
userSchema.methods.getResetPasswordToken = function () {
  // generer le ticket (l'utilisateur recevra ce ticket dans sa boite mail)
  const resetToken = crypto.randomBytes(32).toString('hex')

  // hasher le ticket(on le hash avant de le stocker dans la bdd)
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  // definir la date d'expiration de ce ticket
  this.resetPasswordExpire = Date.now() + 120 * 60 * 1000 // 2 heures (1000 milisecondes * 60 = 1 minute * 120 =2 heures)
  return resetToken
}
// une methode qui empéche l'utilisateur de poster un article plus qu'une fois dans la section "1 iére fois"
userSchema.methods.hasPublished = function () {
  this.firstTimePublished = true
}

// model:
const User = mongoose.model('User', userSchema)

// validation schema with Joi
const validateSchema = (user) => {
  const complexityOptions = {
    min: 8,
    max: 1024,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    symbol: 1,
    requirementCount: 4,
  }
  const schema = Joi.object({
    name: Joi.string().min(5).max(50).required(),
    email: Joi.string().min(5).max(255).email().required(),
    password: passwordComplexity(complexityOptions).required(),
    phoneNumber: Joi.string().min(10).max(10).required(),
  })

  return schema.validate(user)
}
module.exports = { validateSchema, User }
