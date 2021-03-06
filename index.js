
let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let morgan = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let session = require('express-session');
let passport = require('passport');
let expressHbs = require('express-handlebars');
let LocalStrategy = require('passport-local');
let flash = require('connect-flash');
let validator = require('express-validator');
let MongoStore = require('connect-mongo')(session);
let moment = require('moment');
let request = require('request');
let fs = require('fs');


//define the routes
let controllerRoutes = require('./routes/controller');
let marketRoutes = require('./routes/market');
let mailRoutes = require('./routes/mail');
let homeRoutes = require('./routes/index');
let chatRoutes = require('./routes/chat');
let walletRoutes = require('./routes/wallet');
let businessRoutes = require('./routes/business');
let adminRoutes = require('./routes/admin');

var uri = "mongodb://localhost:27017/kornet";
var mongo = 'mongodb://heroku_xh1fmvz6:36dnu9rru6elh1cnip8aokhpjo@ds131510.mlab.com:31510/heroku_xh1fmvz6';// process.env.MONGODB_URI || uri;
// console.log(process.env.MONGODB_URI || uri);
mongoose.connect(mongo);
// //todo: replace this with remote MONGO DB URI
// var LOCAL_MONGO_DB = "mongodb://localhost:27017/kornet";
// mongoose.connect(process.env.MONGO_DB_KORNET || LOCAL_MONGO_DB);

//todo: WHY IS THIS HERE??
let Business = require('./models/business');

require('./config/passport');

var app = express();
app.set('port', process.env.PORT || 3000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', expressHbs({
    defaultLayout: 'main_layout',
    extname: '.hbs',
    helpers: {
        ifCond: function (v1, operator, v2, options) {
            switch (operator) {
                case '==':
                    return (v1 == v2) ? options.fn(this) : options.inverse(this);
                case '===':
                    return (v1 === v2) ? options.fn(this) : options.inverse(this);
                case '!=':
                    return (v1 != v2) ? options.fn(this) : options.inverse(this);
                case '!==':
                    return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                case '<':
                    return (v1 < v2) ? options.fn(this) : options.inverse(this);
                case '<=':
                    return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                case '>':
                    return (v1 > v2) ? options.fn(this) : options.inverse(this);
                case '>=':
                    return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                case '&&':
                    return (v1 && v2) ? options.fn(this) : options.inverse(this);
                case '||':
                    return (v1 || v2) ? options.fn(this) : options.inverse(this);
                default:
                    return options.inverse(this);
            }
        },
        if_eq: function (a, b, opts) {
            if (a == b) // Or === depending on your needs
                return opts.fn(this);
            else
                return opts.inverse(this);
        },
        formatDate: function (date) {
            return moment(date).format('YYYY-MM-DD');
        }
    }
}));
app.set('view engine', '.hbs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan('dev'));
// create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})
// setup the logger
app.use(morgan('combined', {stream: accessLogStream}))

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(validator());
app.use(session({
    secret: 'mysupersecret',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {maxAge: 1800 * 600 * 10000000}
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

app.use(function (req, res, next) {
    res.locals.login = req.isAuthenticated();
    res.locals.session = req.session;
    res.locals.user = req.user;
    next();
});

app.use('/controller', controllerRoutes);
app.use('/business', businessRoutes);
app.use('/wallet', walletRoutes);
app.use('/market', marketRoutes);
app.use('/admin', adminRoutes);
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