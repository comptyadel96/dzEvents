require('express-async-errors')
const express = require('express')
const app = express()
const dotenv = require('dotenv')
dotenv.config({ path: './config/config.env' })
const pug = require('pug')
const cors = require('cors')
const mongoose = require('mongoose')
const helmet = require('helmet')
const morgan = require('morgan')
const colors = require('colors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

// routes
const users = require('./routes/users.js')
const auths = require('./routes/auths.js')
const posts = require('./routes/posts')
const categories = require('./routes/categories')
const adminUser = require('./routes/adminUser')
const stores = require('./routes/stores')

// connect to Mongo
mongoose
  .connect(process.env.MONGODB_KEY, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(console.log('CONNECTED TO MONGODB'.rainbow.bold))
  .catch((err) => console.log(err))

// Middleware
app.use(express.static('./public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
app.use(helmet())
app.use(cors())
process.env.NODE_ENV === 'development' && app.use(morgan('dev'))
// set the view engine
app.set('view engine', 'pug')
app.set('views', './views')
//API Routes :
app.use('/api/users', users)
app.use('/api/auth', auths)
app.use('/api/posts', posts)
app.use('/api/categories', categories)
app.use('/api/adminuser', adminUser)
app.use('/api/store', stores)
app.use(cookieParser())

// app listening
const port = process.env.PORT || 3900
app.listen(port, () => {
  console.log(
    `app listening on port ${port} in ${process.env.NODE_ENV} mode`.blue.bold
  )
})
