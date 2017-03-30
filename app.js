var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');
var expressHbs = require('express-handlebars');
var LocalStrategy = require('passport-local');
var flash = require('connect-flash');
var validator = require('express-validator');
var multer = require('multer');
var MongoStore = require('connect-mongo')(session);



//define the routes 
var marketRoutes = require('./routes/market');
var mailRoutes = require('./routes/mail');
var homeRoutes = require('./routes/index');
var chatRoutes = require('./routes/chat');

// mongo config
// var MONGOLAB_URI= "mongodb://root:root@ds123080.mlab.com:23080/haraka_db_store";
var MONGOLAB_URI = "mongodb://localhost:27017/kornet";
var mongo = MONGOLAB_URI;
mongoose.connect(mongo);

require('./config/passport');

var app = express();
app.set('port', process.env.PORT || 3000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', expressHbs({
    defaultLayout: 'marketplace_layout',
    extname: '.hbs',
    helpers: {
        if_eq: function (a, b, opts) {
            if (a == b) // Or === depending on your needs
                return opts.fn(this);
            else
                return opts.inverse(this);
        }
    }
}));
app.set('view engine', '.hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(validator());
app.use(session({
    secret: 'mysupersecret',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {maxAge: 180 * 60 * 1000}
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));


app.use(function (req, res, next) {
    res.locals.login = req.isAuthenticated();
    res.locals.session = req.session;
    next();
});

app.use('/market', marketRoutes);
app.use('/chat', chatRoutes);
app.use('/mail', mailRoutes);
app.use('/', homeRoutes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;