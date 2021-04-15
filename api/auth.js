const authSecret = process.env.AUTH_SECRET
const jwt = require('jwt-simple')
const bcrypt = require('bcrypt-nodejs')

module.exports = app => {
    const signin = async (req, res) => {
        if (!req.body.usuario || !req.body.senha) {
            return res.status(400).send('Informe usuário e senha!')
        }

        const { User } = app.api.user;
        const usuario = await User.findOne({ usuario: req.body.usuario })

        if (!usuario) return res.status(400).send('Usuário não encontrado!')

        const isMatch = bcrypt.compareSync(req.body.senha, usuario.senha)
        if (!isMatch) return res.status(401).send('Usuário/Senha inválidos!')

        const now = Math.floor(Date.now() / 1000)

        const payload = {
            ...usuario.toObject(),
            iat: now,
            exp: now + (60 * 60 * 24 * 3)
        }

        delete payload.senha

        res.json({
            ...payload,
            token: jwt.encode(payload, authSecret)
        })
    }

    const validateToken = async (req, res) => {
        const userData = req.body || null
        try {
            if(userData) {
                const token = jwt.decode(userData.token, authSecret)
                if(new Date(token.exp * 1000) > new Date()) {
                    return res.send(true)
                }
            }
        } catch(e) {
            // problema com o token
        }

        res.send(false)
    }

    return { signin, validateToken }
}
