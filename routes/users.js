const express = require('express')
const router = express.Router()
const path = require('path')
const _ = require('lodash')
const { User, validateSchema } = require('../models/user.js')
const Joi = require('joi')
const passwordComplexity = require('joi-password-complexity').default
const auth = require('../middlewares/auth')
const bcrypt = require('bcrypt')
const multer = require('multer')
// const sharp = require('sharp')
const { cloudinaryConfig, uploader } = require('../middlewares/cloudinaryConfig')
router.use('*', cloudinaryConfig)
const DatauriParser = require('datauri/parser')

// voir les infos de l'utilisateur déja connecter (ses propres infos de compte)
router.get('/me', auth, async (req, res) => {
  const user = await User.findOne({ _id: req.user._id }).select('-password')
  res.send(user)
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
  if (!user) return res.status(500).send('une erreur s"est produite veuillez réessayer dans un moment')
  res.status(200).json({
    message: 'Bravo vous avez mis à jour vos informations  !',
    data: user,
  })
})

// mettre à jour le mot de passe de l'utilisateur
router.put('/updatepassword', auth, async (req, res) => {
  const user = await User.findById(req.user._id)
  // il entre son mot de passe actuel et on le verifie
  const validatePassword = await bcrypt.compare(req.body.password, user.password)
  if (!validatePassword) return res.status(400).send('mot de passe invalide!')

  const { error } = validateSchema2(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  // si le mot de passe actuel est juste alors on met à jour le nouveau MDP
  user.password = req.body.newPassword
  await user.save()
  const token = await user.createTokenAuth()
  res.header('x-auth-token', token).send(_.pick(user, ['name', 'email', '_id', 'phoneNumber', 'firstTimePublished']))
})

// configurer la photo de profil :
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
  },
  destination: (req, file, cb) => {
    cb(null, './public/profilePictures')
  },
})
const upload = multer({
  limits: {
    fileSize: 5000000,
  },
  storage: storage,
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/gi)) {
      return cb(new Error('le fichier doit étre au format image de taille inférieure ou égale a 5MBs'))
    }
    cb(undefined, true)
  },
}).single('profilePic')

// ajouter un nouvelle utilisateur
router.post('/', upload, async (req, res) => {
  // const { error } = await validateSchema(req.body)
  // if (error) return res.status(400).send(error.details[0].message)

  // verifier si l'utilisateur n'a pas déja un compte
  let user = await User.findOne({ email: req.body.email })
  if (user) return res.status(400).send('cet email a deja été utiliser si vous avez oublier le mot de passe appuyer sur mot de passe oublier')

  user = new User(_.pick(req.body, ['name', 'email', 'password', 'confirmPassword', 'phoneNumber']))
  await user.save()
  // si l'utilisateur veut telecharger une photo de profile
  if (req.file) {
    console.log(req.file)
    user.profilePicture = req.file.path.replace('public', 'http://192.168.1.38:3900/')
    await user.save()
    return res.status(200).send('photo telecharger avec succées')
  }
  // on donne un ticket pour le nouvelle utilisateur et on crée un header personalisé(x-auth-token)
  const token = await user.createTokenAuth()
  return res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email', 'phoneNumber', ' firstTimePublished', 'profilePicture']))
})

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

// si vous decider d'utiliser sharp pour redimensionner les images et utiliser le service cloudinary pour telecharger les photos
// dans le cloud on utilise ce code ci-dessous =>

// ajouter une photo de profil
// router.post(
//   '/me/profilpicture',
//   auth,
//   upload,
//   async (req, res) => {
//     let user = await User.findOne({ _id: req.user._id })
//     const buffer = await sharp(req.file.buffer).png().resize({ width: 200, height: 250 }).toBuffer()
//     const parser = new DatauriParser()
//     const file = parser.format(path.extname(req.file.originalname).toString(), buffer).content
//     if (req.file) {
//       await uploader.upload(file).then(async (result) => {
//         user.profilePicture = result.url
//         await user.save()
//         res.send('photo télécharger avec succés')
//       })
//     }
//   },
//   (error, req, res, next) => {
//     res.status(400).send({ erreur: error.message })
//     // une 3 iéme fonction qui sert de middleware pour generer le msg d'erreur
//   }
// )
