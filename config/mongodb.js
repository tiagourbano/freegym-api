const mongoose = require('mongoose')
mongoose
    .connect(
        'mongodb+srv://freegym:freegym123@freegym.dlmvy.mongodb.net/freegym?retryWrites=true&w=majority',
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: true
        }
    )
    .catch(e => {
        const msg = 'ERRO! Não foi possível conectar com o MongoDB!'
        console.log('\x1b[41m%s\x1b[37m', msg, '\x1b[0m')
    })
