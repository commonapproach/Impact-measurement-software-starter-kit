const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cookieSession = require('cookie-session');
const cors = require('cors');

const {
  baseRoute,
} = require('../routes/baseRoute');
const {authMiddleware, errorHandler} = require('../services/middleware');


const config = require('../config');
const {initUserAccounts} = require('../services/userAccount/user');
const {initStreetTypes, initStreetDirections} = require('../services/address');
const {organizationRoute, organizationsRoute, usersRoute, domainRoute, domainsRoute, indicatorsRoute, indicatorRoute,
  outcomesRoute, outcomeRoute, indicatorReportRoute, indicatorReportsRoute, userRoute
} = require("../routes");

const {userTypesRoute, profileRoute, dynamicClassInstancesRoute} = require("../routes/general");

const app = express();

// Trust our reverse proxy
app.set('trust proxy', ['::ffff:172.31.12.233', '172.31.12.233']);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cors({
  credentials: true,
  origin: config.allowedOrigins
}));
app.use(cookieParser());
app.use(cookieSession(config.cookieSession));

// Public routes
// Generate token for login (for frontend is in the cookie)
app.use('/api', baseRoute);

// Authentication required for the below routes
app.use('/api', authMiddleware('Session expired, please login again'));
// Check authorization

// app.use('/api/general', generalUserRoute);

// Private routes

// routes only for superuser
// app.use('/api/superuser', superuserRoute);
// app.use('/api/groupAdmin', groupAdminRoute);
// app.use('/api/admin', adminRoute);
app.use('/api/user', userRoute);
app.use('/api/users', usersRoute);
app.use('/api/organization', organizationRoute);
app.use('/api/organizations', organizationsRoute);
app.use('/api/domain', domainRoute);
app.use('/api/domains', domainsRoute);
app.use('/api/indicator', indicatorRoute)
app.use('/api/indicators', indicatorsRoute);
app.use('/api/outcome', outcomeRoute);
app.use('/api/outcomes', outcomesRoute);
app.use('/api/indicatorReports', indicatorReportsRoute);
app.use('/api/indicatorReport', indicatorReportRoute);
app.use('/api/userTypes', userTypesRoute);
app.use('/api/profile', profileRoute);
app.use('/api/dynamicClassInstances', dynamicClassInstancesRoute);
app.use('/api/domains', domainsRoute);
app.use('/api/domain', domainRoute);


// app.use('/api', internalTypeRoute);


initUserAccounts();
initStreetTypes();
initStreetDirections();

app.use(errorHandler);

process.env.TZ = 'America/Toronto';

module.exports = app;
