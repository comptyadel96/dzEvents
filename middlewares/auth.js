const jwt = require("jsonwebtoken")

module.exports = async function (req, res, next) {
  const token = req.header("x-auth-token")
  if (!token)
    return res.status(401).send({
      erreure: "vous devez etre connecter pour intéragir avec ce contenu",
    })
  try {
    const encoded = jwt.verify(token, process.env.JWT_TOKEN_KEY)
    req.user = encoded
    next()
  } catch (e) {
    res.status(403).send(e)
  }
}
