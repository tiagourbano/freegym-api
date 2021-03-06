const app = require('express')()
const consign = require('consign')
const mongoose = require('mongoose')

require('./config/mongodb')
app.mongoose = mongoose

consign()
    .include('./config/passport.js')
    .then('./config/middlewares.js')
    .then('./api/validation.js')
    .then('./api')
    .then('./config/routes.js')
    .into(app)

app.get('/', (req, res) => {
    res.send('Free Gym - API')
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Backend executando...')
})

module.exports = app
