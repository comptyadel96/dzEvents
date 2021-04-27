const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { User } = require('../models/user.js')
const Joi = require('joi')
const passwordComplexity = require('joi-password-complexity').default
const  sendMailgun = require('../utils/sendMailgun')
const _ = require('lodash')


router.post('/', async (req, res, next) => {
  // verifier si l'utilisateur n'a pas déja un compte
  let user = await User.findOne({ email: req.body.email })
  if (!user) return res.status(400).send('email ou mot de passe incorrecte')
  // verifier le mot de passe:
  const validPassword = await bcrypt.compare(req.body.password, user.password)
  if (!validPassword)
    return res.status(400).send('email ou mot de passe incorrecte')

  const token = await user.createTokenAuth()
  res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']))
})

// recuperer le mot de passe en cas d'oublie (avoir le ticket de récupération (resetToken))
router.post('/forgotpassword', async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user)
    return res.status(400).send('aucun utilisateur trouvé avec cet email ')
  // get reset token
  const resetToken = await user.getResetPasswordToken()
  await user.save({ validateBeforeSave: false })
  // envoyer le lien du reset password
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`
  const message = `Salutation , pour redéfinir votre mot de passe faite un put request ici ${resetUrl} `  

  try {
    await  sendMailgun({
      email: req.body.email,
      subject: 'récuperation du mot de passe',
      message,
    })
    res.status(200).send('email sent') 
  } catch (e) {
    console.log(e)
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save({ validateBeforeSave: false })
    
  }
})

// aprées avoir eu l'email de résiliation du mot de passe on sera redérigé dans la page /api/auth/resetPassword/:resetToken
router.put('/resetpassword/:resettoken', async (req, res) => {
  const resetPasswordToken = await crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex')

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  })
  if (!user) {
    return res.status(404).send('ticket de récupération invalide')
  }
  // valider et creer le nouveau mot de passe !
  const { error } = await validateSchema(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  user.password = req.body.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined

  await user.save()
  const token = await user.createTokenAuth()
  res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']))
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

const validateSchema = (data) => {
  const schema = Joi.object().keys({
    password: passwordComplexity(complexityOptions).required(),
  })

  return schema.validate(data)
}

module.exports = router
