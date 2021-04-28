
const { config, uploader }= require('cloudinary').v2 
 // on configure cloudinary avec nos données de compte persos 
 // ouvrer un compte gratuitmenet ici =>http://cloudinary.com 
const cloudinaryConfig = (req, res, next) => {
config({
cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
api_key: process.env.CLOUDINARY_API_KEY,
api_secret: process.env.CLOUDINARY_API_SECRET,
})
next();
}
module.exports= { cloudinaryConfig, uploader }