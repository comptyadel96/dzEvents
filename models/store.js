const mongoose = require("mongoose")

const storeSchema = new mongoose.Schema(
  {
    article: {
      type: String,
      minlength: 5,
      maxlength: 1024,
      required: [true, "veuillez donner un titre à votre article ou service!"],
      trim: true,
    },
    prix: {
      type: String,
      minlength: 1,
      maxlength: 100,
      required: [true, "veuillez défénir un prix à votre article ou service !"],
    },
    wilaya: {
      type: String,
      minlength: 2,
      maxlength: 100,
      required: [true, "vous devez spécifiez votre  wilaya"],
    },
    description: {
      type: String,
      maxlength: 2200,
    },
    photos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Photo" }],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
  },
  { timestamps: true }
)
storeSchema.index({ article: "text" })

const Store = mongoose.model("Store", storeSchema)
module.exports = { Store }
