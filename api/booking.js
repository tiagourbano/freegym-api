const moment = require('moment');
const bcrypt = require('bcrypt-nodejs');

module.exports = app => {
  const Booking = app.mongoose.model('Booking', {
    userId: {
      type: app.mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bookingDate: Number,
    original: Boolean,
    checkedIn: {
      type: app.mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  })

  const { existsOrError, equalsOrError } = app.api.validation

  const save = async (req, res) => {
    const { bookingDate } = { ...req.body }
    const userId = req.user ? req.user._id : null;

    try {
      existsOrError(userId, 'Usuário não informado')
      existsOrError(bookingDate, 'Data e Hora da reserva não informada')
    } catch(msg) {
      return res.status(400).send(msg)
    }

    if (userId) {
      const newBooking = new Booking({userId, bookingDate})
      newBooking.save()
        .then(_ => res.status(204).send())
        .catch(err => res.status(500).send(err))
    }
  }

  const getBookingByUser = async (req, res) => {
    const userId = req.user ? req.user._id : null
    const startDayBooking = moment().startOf('d').valueOf()
    const endDayBooking = moment().add(7, 'd').endOf('d').valueOf()

    try {
      existsOrError(userId, 'Usuário não informado')
    } catch(msg) {
      return res.status(400).send(msg)
    }

    const bookings = await Booking.find({
      userId,
      bookingDate: {
        $gte: startDayBooking,
        $lte: endDayBooking
      }
    })

    return res.json(bookings)
  }

  const removeOwnBookingById = async (req, res) => {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId)

    try {
      existsOrError(booking, 'Reserva não encontrada.')
      equalsOrError(booking.userId.toString(), req.user._id, 'Esta reserva não pertence a você.')

      await booking.remove()
      return res.status(204).send()
    } catch(msg) {
      return res.status(400).send(msg)
    }
  }

  const getAvailableBookingByDay = async (req, res) => {
    const startDayBooking = moment(req.query.day, 'YYYY-MM-DD').startOf('d').valueOf()
    const endDayBooking = moment(req.query.day, 'YYYY-MM-DD').endOf('d').valueOf()

    const bookings = await Booking.find({
      bookingDate: {
        $gte: startDayBooking,
        $lte: endDayBooking
      }
    }).populate('userId')

    const result = [];

    for (let i = 0; i <= 23; i++) {
      const currentHour = moment(req.query.day, 'YYYY-MM-DD').startOf('d').add(i, 'hour').valueOf()
      const hasBooking = bookings.filter(booking => booking.bookingDate === currentHour)[0]

      if (hasBooking) {
        result.push({
          date: currentHour,
          user: `${hasBooking.userId.torre} ${hasBooking.userId.unidade}`
        })
      } else {
        result.push({
          date: currentHour,
          user: null
        })
      }
    }

    return res.json(result)
  }

  const getCurrentStatusBooking = async (req, res) => {
    const currentDateTimeHourBooking = moment().minutes(0).seconds(0).milliseconds(0).valueOf()
    const currentDateTimeBooking = moment().seconds(0).milliseconds(0).valueOf()
    const expireDateTimeBooking = moment().minutes(1).seconds(0).milliseconds(0).valueOf()

    const booking = await Booking.findOne({
      bookingDate: currentDateTimeHourBooking
    }).populate('userId').populate('checkedIn')

    if (booking && booking.checkedIn && booking.original) {
      return res.json({
        bookingDate: currentDateTimeHourBooking,
        status: 'busy',
        type: 'warning',
        message: `Em uso: ${booking.checkedIn.torre} - ${booking.checkedIn.unidade}`,
      })
    }

    if (booking && booking.checkedIn && !booking.original) {
      return res.json({
        bookingDate: currentDateTimeHourBooking,
        status: 'busy',
        type: 'error',
        message: `Em uso: ${booking.checkedIn.torre} - ${booking.checkedIn.unidade}`,
      })
    }

    if (booking && !booking.checkedIn && currentDateTimeBooking < expireDateTimeBooking) {
      return res.json({
        status: 'waiting',
        user: `${booking.userId.usuario}`,
        bookingDate: currentDateTimeHourBooking,
        original: true,
        type: 'blue-grey',
        message: `Aguardando: ${booking.userId.torre} - ${booking.userId.unidade}`,
      })
    }

    return res.json({
      status: 'available',
      bookingDate: currentDateTimeHourBooking,
      original: false,
      type: 'success',
      message: `Disponível`,
    })
  }

  const checkIn = async (req, res) => {
    if (!req.body.user || !req.body.pass) {
      return res.status(400).send('Informe usuário e senha!')
    }

    const { User } = app.api.user;
    const usuario = await User.findOne({ usuario: req.body.user })

    if (!usuario) return res.status(400).send('Usuário não encontrado!')

    const isMatch = bcrypt.compareSync(req.body.pass, usuario.senha)
    if (!isMatch) return res.status(401).send('Usuário/Senha inválidos!')

    const booking = await Booking.findOne({ bookingDate: req.body.bookingDate })

    if (booking) {
      await booking.updateOne({
        original: req.body.original,
        checkedIn: usuario._id
      })
    } else {
      const newBooking = new Booking({
        userId: usuario._id,
        bookingDate: req.body.bookingDate,
        original: false,
        checkedIn: usuario._id
      })
      await newBooking.save()
    }

    return res.status(204).send();
  }

  const checkOut = async (req, res) => {
    try {
      const booking = await Booking.findOne({ bookingDate: req.body.bookingDate });
      delete booking.checkedIn;
      await booking.updateOne({ checkedIn: null });

      return res.status(204).send();
    } catch(err) {
      return res.status(400).send('Falha ao fazer check-out!');
    }
  }

  return {
    Booking,
    save,
    getBookingByUser,
    removeOwnBookingById,
    getAvailableBookingByDay,
    getCurrentStatusBooking,
    checkIn,
    checkOut
  }
}
