const cors = require('cors');
const RequestRefusalError = require('../utils/RequestRefusalError');

const allowedOrigins = new RegExp(
	process.env.ALLOWED_ORIGINS || /^(http(s?):\/\/localhost((:\d{1,5})?))$/ // guardrails-disable-line
);

const corsOptions = {
	origin: (origin, callback) => {
		if (
			!origin ||
			origin.match(allowedOrigins) ||
			process.env.NODE_ENV === 'development'
		) {
			callback(null, true);
		} else {
			callback(
				new RequestRefusalError('Not allowed by CORS', 'INVALID_ORIGIN')
			);
		}
	},
	credentials: true
};

module.exports = cors(corsOptions);
