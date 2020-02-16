const
	opengraph = require("./opengraph"),
	dotenv = require('dotenv'),
	db = require("./database"),
	sessionValidator = require("./tools/sessionValidator"),
	app_port = process.env.PORT || 3001,
	bodyParser = require("body-parser"),
	cookieParser = require('cookie-parser'),
	express = require("express"),
	app = express(),
	http = require('http'),
	server = http.createServer(app),
	morgan = require("morgan"),
	expressSession = require("express-session"),
	SequelizeConnectSession = require('connect-session-sequelize')(expressSession.Store),
	sequelizeStore = new SequelizeConnectSession({db: db.sequelize}),
	session = expressSession({
		secret: process.env.SESSION_SECRET || "some_semi_permanent_secret",
		name: "session",
		resave: true,
		saveUninitialized: false,
		store: sequelizeStore,
		cookie: {
			path: '/',
			httpOnly: true,
			secure: false,
			maxAge: Number(process.env.SESSION_MAX_AGE) || (15 * 86400 * 1000)
		},
		rolling: true
	});

dotenv.config();

sequelizeStore.sync();

app.use(session);

app.use(cookieParser(process.env.SESSION_SECRET || "some_semi_permanent_secret"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Allow our front end to make requests
const allowed_origins = (process.env.ALLOWED_ORIGINS || "").split(" ");
app.use("/", (req, res, next) => {
	let origin = req.get("origin");
	if(allowed_origins.includes(origin)){
		res.header("Access-Control-Allow-Origin", origin);
		res.header("Access-Control-Allow-Methods", "POST, GET, PUT");
		res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
	}

	next();
});

app.use(opengraph);

app.use(
	morgan(
		process.env.MORGAN_FORMAT || "dev",
		{skip: (req, res) =>  res.statusCode < 400}
	)
);

// Leave the session validation here so that it isn't unnecessarily triggered by static files
app.use(sessionValidator);

// OTHER ROUTES
app.use("/", require("./routes"));

server.listen(app_port, () => {
	console.log('listening on *:' + app_port);
});
