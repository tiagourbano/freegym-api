const bcrypt = require('bcrypt-nodejs')

module.exports = app => {
    const User = app.mongoose.model('User', {
        torre: String,
        torreSigla: String,
        unidade: Number,
        usuario: String,
        senha: String,
        createdAt: {
            type: Date,
            required: true,
            default: Date.now
        },
        role: {
            type: String,
            required: true,
            enum: ['user', 'place', 'admin'],
            default: 'user'
        },
    })

    const { existsOrError, notExistsOrError } = app.api.validation

    const encryptPassword = password => {
        const salt = bcrypt.genSaltSync(10)
        return bcrypt.hashSync(password, salt)
    }

    const save = async (req, res) => {
        const user = { ...req.body }
        if(req.params.id) user._id = req.params.id

        if(!req.originalUrl.startsWith('/users')) user.admin = false
        if(!req.user || !req.user.admin) user.admin = false

        try {
            existsOrError(user.torre, 'Torre não informado')
            existsOrError(user.unidade, 'Unidade não informado')
            existsOrError(user.usuario, 'Usuário não informado')
            existsOrError(user.senha, 'Senha não informada')

            const userFromDB = await User.findOne({usuario: user.usuario})
            if(!user._id) {
                notExistsOrError(userFromDB, 'Usuário já cadastrado')
            }
        } catch(msg) {
            return res.status(400).send(msg)
        }

        user.senha = encryptPassword(user.senha)

        if (user._id) {
            User.findByIdAndUpdate(user._id, { $set: user })
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        } else {
            const newUser = new User(user)
            newUser.save()
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        }
    }

    // const get = (req, res) => {
    //     app.db('users')
    //         .select('id', 'name', 'email', 'admin')
    //         .whereNull('deletedAt')
    //         .then(users => res.json(users))
    //         .catch(err => res.status(500).send(err))
    // }

    // const getById = (req, res) => {
    //     app.db('users')
    //         .select('id', 'name', 'email', 'admin')
    //         .where({ id: req.params.id })
    //         .whereNull('deletedAt')
    //         .first()
    //         .then(user => res.json(user))
    //         .catch(err => res.status(500).send(err))
    // }

    // const remove = async (req, res) => {
    //     try {
    //         const articles = await app.db('articles')
    //             .where({ userId: req.params.id })
    //         notExistsOrError(articles, 'Usuário possui artigos.')

    //         const rowsUpdated = await app.db('users')
    //             .update({deletedAt: new Date()})
    //             .where({ id: req.params.id })
    //         existsOrError(rowsUpdated, 'Usuário não foi encontrado.')

    //         res.status(204).send()
    //     } catch(msg) {
    //         res.status(400).send(msg)
    //     }
    // }

    // return { save, get, getById, remove }
    return { User, save }
}
