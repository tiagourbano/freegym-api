const admin = require('./admin')

module.exports = app => {
    app.post('/register', app.api.user.save)
    app.post('/login', app.api.auth.signin)
    app.post('/validateToken', app.api.auth.validateToken)

    app.route('/booking')
        .all(app.config.passport.authenticate())
        .get(app.api.booking.getBookingByUser)
        .post(app.api.booking.save)

    app.route('/booking/:id')
        .all(app.config.passport.authenticate())
        .delete(app.api.booking.removeOwnBookingById)

    app.route('/booking/date')
        .all(app.config.passport.authenticate())
        .get(app.api.booking.getAvailableBookingByDay)

    app.route('/booking/status')
        .all(app.config.passport.authenticate())
        .get(app.api.booking.getCurrentStatusBooking)

    app.route('/booking/check-in')
        .all(app.config.passport.authenticate())
        .post(app.api.booking.checkIn)

    // app.route('/users/:id')
    //     .all(app.config.passport.authenticate())
    //     .put(admin(app.api.user.save))
    //     .get(admin(app.api.user.getById))
    //     .delete(admin(app.api.user.remove))
}
