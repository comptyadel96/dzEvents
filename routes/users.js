const express = require('express')
const router = express.Router()
const _ = require('lodash')
const { User, validateSchema } = require('../models/user.js')
const Joi = require('joi')
const passwordComplexity = require('joi-password-complexity').default
const auth = require('../middlewares/auth')
const bcrypt = require('bcrypt')
const multer = require('multer')
const sharp = require('sharp')

// avoir les infos l'utilisateur déja connecter
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password')
  res.send(user)
})

// ajouter un nouvelle utilisateur
router.post('/', async (req, res) => {
  const { error } = await validateSchema(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  // verifier si l'utilisateur n'a pas déja un compte
  let user = await User.findOne({ email: req.body.email })
  if (user)
    return res
      .status(400)
      .send(
        'cet email a deja été utiliser si vous avez oublier le mot de passe appuyer sur mot de passe oublier'
      )

  user = new User(
    _.pick(req.body, ['name', 'email', 'password', 'phoneNumber'])
  )
  await user.save()
  // on donne un ticket pour le nouvelle utilisateuret on crée un header personalisé(x-auth-token)
  const token = await user.createTokenAuth()
  res
    .header('x-auth-token', token)
    .send(_.pick(user, ['_id', 'name', 'email', 'phoneNumber',' firstTimePublished']))
})

// mettre a jour les coordonnées de l'utilisateur (juste le nom ou l'email)
router.put('/updatedetails', auth, async (req, res) => {
  fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  }
  const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    runValidators: true,
    new: true,
  })
  if (!user)
    return res
      .status(500)
      .send('une erreur s"est produite veuillez réessayer dans un moment')
  res.status(200).json({
    message: 'Bravo vous avez mis à jour vos informations  !',
    data: user,
  })
})

// mettre à jour le mot de passe de l'utilisateur
router.put('/updatepassword', auth, async (req, res) => {
  const user = await User.findById(req.user._id)

  const validatePassword = await bcrypt.compare(
    req.body.password,
    user.password
  )
  if (!validatePassword)
    return res.status(400).send('mot de passe invalide!')

  const { error } = await validateSchema2(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  user.password = req.body.newPassword
  await user.save()
  const token = await user.createTokenAuth()
  res
    .header('x-auth-token', token)
    .send(_.pick(user, ['name', 'email', '_id', 'phoneNumber']))
})

// configurer la photo de profil :
const upload = multer({
  // dest: 'profilePictures', on l'enléve pour pouvoir enregistrer l'image de le User model au lieux du dossier profilePictures
  limits: {
    fileSize: 2000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/ig)) {
      return cb(
        new Error(
          'le type de fichier doit étre une image de taille inférieure ou égale a 2MBs '
        )
      )
    }
    cb(undefined, true)
  },
})
// ajouter une photo de profil 
router.post('/me/profilpicture', auth,upload.single('profilePic'), async (req, res) => {
    let user = await User.findOne({ _id: req.user._id })
    // user.profilePicture = req.file.buffer => hadi 9bal manasta3amlou sharp
    const buffer = await sharp(req.file.buffer)
      .png()
      .resize({ width: 250, height: 250 })
      .toBuffer()
    user.profilePicture = buffer
    await user.save()
    res.send('fichier télécharger avec succés')
  },
  (error, req, res, next) => {
    res.status(400).send({ erreur: error.message })
    // une 3 iéme fonction qui sert de middleware pour generer le msg d'erreur
  }
)
// supprimer l'image d'utilisateur
router.delete('/me/profilpicture', auth, async (req, res) => {
  let user = await User.findOne({ _id: req.user._id })
  if (!user.profilePicture) {
    res.status(404).send('aucune photo n a été  trouver pour ce profil')
  }
  user.profilePicture = undefined
  await user.save()
  res.send('la photo a bien été supprimer')
})

// servir l'image au client  :
router.get('/:id/profilpicture', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user || !user.profilePicture) {
      throw new Error()
    }
    res.set('Content-Type', 'image/png')
    res.send(user.profilePicture)
  } catch (e) {
    res.status(404)
  }
})

const complexityOptions = {
  min: 8,
  max: 1024,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 4,
}

// validation en cas ou l'utilisateur change son mot de passe
const validateSchema2 = (password) => {
  const schema = Joi.object().keys({
    password: passwordComplexity(complexityOptions).required(),
    newPassword: passwordComplexity(complexityOptions).required(),
  })

  return schema.validate(password)
}

module.exports = router
