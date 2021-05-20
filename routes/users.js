const express = require("express")
const router = express.Router()
const path = require("path")
const _ = require("lodash")
const { User } = require("../models/user.js")
const Joi = require("joi")
const passwordComplexity = require("joi-password-complexity").default
const auth = require("../middlewares/auth")
const bcrypt = require("bcrypt")
const multer = require("multer")
const sharp = require("sharp")
const DatauriParser = require("datauri/parser")
const { uploader } = require("../middlewares/cloudinaryConfig")

// voir les infos de l'utilisateur déja connecter (ses propres infos de compte)
router.get("/me", auth, async (req, res) => {
  const user = await User.findOne({ _id: req.user._id }).select("-password")
  res.send(user)
})

// mettre a jour les coordonnées de l'utilisateur (juste le nom , l'email et le num de téléphone)
router.put("/updatedetails", auth, async (req, res) => {
  fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
  }
  const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
  })
  if (!user)
    return res
      .status(500)
      .send('une erreur s"est produite veuillez réessayer dans un moment')
  res.status(200).json({
    message: "Bravo vous avez mis à jour vos informations  !",
    data: user,
  })
})

// mettre à jour le mot de passe de l'utilisateur
router.put("/updatepassword", auth, async (req, res) => {
  const user = await User.findById(req.user._id)
  // il entre son mot de passe actuel et on le verifie
  const validatePassword = await bcrypt.compare(
    req.body.password,
    user.password
  )
  if (!validatePassword) return res.status(401).send("mot de passe invalide!")

  const { error } = validateSchema2(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  // si le mot de passe actuel est juste alors on met à jour le nouveau MDP
  user.password = req.body.newPassword
  await user.save()
  const token = await user.createTokenAuth()
  res
    .header("x-auth-token", token)
    .send(
      _.pick(user, [
        "name",
        "email",
        "_id",
        "phoneNumber",
        "firstTimePublished",
      ])
    )
})

// configurer la photo de profile :
const upload = multer({
  limits: {
    fileSize: 5000000,
  },

  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/gi)) {
      return cb(
        new Error(
          "le fichier doit étre au format image de taille inférieure ou égale a 5MBs"
        )
      )
    }
    cb(undefined, true)
  },
}).single("profilePic")

// ajouter un nouvelle utilisateur
router.post("/", upload, async (req, res) => {
  // verifier si l'utilisateur n'a pas déja un compte
  let user = await User.findOne({ email: req.body.email })
  if (user)
    return res
      .status(401)
      .send(
        "cet email a deja été utiliser si vous avez oublier le mot de passe appuyer sur mot de passe oublier"
      )

  user = new User(
    _.pick(req.body, ["name", "email", "password", "phoneNumber"])
  )
  await user.save()
  // si l'utilisateur veut telecharger une photo de profile
  if (req.file) {
    const buffer = await sharp(req.file.buffer)
      .resize({ height: 350, width: 350 })
      .png()
      .toBuffer()
    // convertir le buffer en lien
    const parser = new DatauriParser()
    const file = parser.format(
      path.extname(req.file.originalname).toString(),
      buffer
    ).content
    await uploader.upload(file.toString()).then(async (result, error) => {
      if (error) {
        console.log(error)
      }
      user.profilePicture = result.url
      await user.save()
    })
  } else {
    return res.status(200).send(post)
  }
  // on donne un ticket pour le nouvelle utilisateur et on crée un header personalisé(x-auth-token)
  const token = await user.createTokenAuth()
  return res
    .header("x-auth-token", token)
    .send(
      _.pick(user, [
        "_id",
        "name",
        "email",
        "phoneNumber",
        "firstTimePublished",
        "profilePicture",
      ])
    )
})

// supprimer l'image d'utilisateur
router.delete("/me/profilpicture", auth, async (req, res) => {
  let user = await User.findOne({ _id: req.user._id })
  if (!user.profilePicture) {
    res.status(404).send("aucune photo n a été  trouver pour ce profil")
  }
  user.profilePicture = undefined
  await user.save()
  res.send("la photo a bien été supprimer")
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
// ajouter une photo de profile si l'utilisateur n'a pas ajouter la photo au moment de la création de son compte
router.put("/me/profilpicture", auth, upload, async (req, res) => {
  let user = await User.findOne({ _id: req.user._id })
  const buffer = await sharp(req.file.buffer)
    .png()
    .resize({ width: 200, height: 250 })
    .toBuffer()
  const parser = new DatauriParser()
  const file = parser.format(
    path.extname(req.file.originalname).toString(),
    buffer
  ).content

  await uploader.upload(file).then(async (result) => {
    user.profilePicture = result.url
    await user.save()
    res.send("photo mis à jour avec succés")
  })
})

module.exports = router
