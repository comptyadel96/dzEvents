require('express-async-errors')
const express = require('express')
const app = express()
const dotenv = require('dotenv')
dotenv.config({ path: './config/config.env' })
const cors = require('cors')
const mongoose = require('mongoose')
const helmet = require('helmet')
const morgan = require('morgan')
const colors = require('colors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const compression=require('compression')
// routes
const users = require('./routes/users.js')
const auths = require('./routes/auths.js')
const posts = require('./routes/posts')
const adminUser = require('./routes/adminUser')
const stores = require('./routes/stores')
const firstTime=require('./routes/firstTimes')

// connect to Mongo
mongoose
  .connect( process.env.MONGODB_PROD, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(console.log('CONNECTED TO MONGODB'.rainbow.bold))
  .catch((err) => console.log(err))

// Middleware
app.use(express.static('./public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json())
app.use(helmet())
app.use(compression())
app.use(cors())
process.env.NODE_ENV === 'development' && app.use(morgan('dev'))
// set the view engine
app.set('view engine', 'pug')
app.set('views', './views')
// Routes :
app.use('/dzevents/v1/users', users)
app.use('/dzevents/v1/auth', auths)
app.use('/dzevents/v1/posts', posts)
app.use('/dzevents/v1/adminuser', adminUser)
app.use('/dzevents/v1/store', stores)
app.use('/dzevents/v1/firsttime',firstTime)
app.use(cookieParser())

// app listening
const PORT = process.env.PORT || 3900
app.listen(PORT, () => {
  console.log(
    `app listening on port ${PORT} in ${process.env.NODE_ENV} mode`.blue.bold
  )
})
