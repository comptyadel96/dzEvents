const mongoose = require('mongoose')

const photoSchema = new mongoose.Schema({
  url: String,
})
const Photos = mongoose.model('Photo', photoSchema)
module.exports=Photos
