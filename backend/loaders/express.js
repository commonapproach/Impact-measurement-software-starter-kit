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
const {initUserAccounts, addSuperPassword} = require('../services/userAccount/user');
const {initStreetTypes, initStreetDirections} = require('../services/address');
const {organizationRoute, organizationsRoute, usersRoute, themeRoute, themesRoute, indicatorsRoute, indicatorRoute,
  outcomesRoute, outcomeRoute, indicatorReportRoute, indicatorReportsRoute, userRoute, groupsRoute, groupRoute,
  errorReportRoute, fileUploadingRoute, stakeholderRoute, stakeholdersRoute, codeRoute, codesRoute, characteristicRoute,
  characteristicsRoute
} = require("../routes");

const {userTypesRoute, profileRoute, dynamicClassInstancesRoute} = require("../routes/general");
const {MDBApiModel} = require("../models/logging/api");

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

app.use((req, res, next) => {
  const previousJson = res.json
  res.json = function (...args) {
    // const recordedRes= new MDBApiResModel({success: args[0].success, message: args[0].message, date: new Date()})
    (new MDBApiModel({
      req: {url: req.originalUrl, method: req.method},
      res: {success: args[0].success, message: args[0].message},
      date: new Date()
    })).save()
    previousJson.call(this, ...args)
  }
  next();
})
// Public routes
// Generate token for login (for frontend is in the cookie)
app.use('/api', baseRoute);

// Authentication required for the below routes
// Check authorization
app.use('/api', authMiddleware('Session expired, please login again'));

app.use('/api/reportError', errorReportRoute)
app.use('/api/user', userRoute);
app.use('/api/dynamicClassInstances', dynamicClassInstancesRoute)
app.use('/api/users', usersRoute);
app.use('/api/organization', organizationRoute);
app.use('/api/organizations', organizationsRoute);
app.use('/api/stakeholder', stakeholderRoute)
app.use('/api/stakeholders', stakeholdersRoute)
app.use('/api/theme', themeRoute);
app.use('/api/themes', themesRoute);
app.use('/api/indicator', indicatorRoute);
app.use('/api/fileUploading', fileUploadingRoute);
app.use('/api/indicators', indicatorsRoute);
app.use('/api/outcome', outcomeRoute);
app.use('/api/outcomes', outcomesRoute);
app.use('/api/indicatorReports', indicatorReportsRoute);
app.use('/api/indicatorReport', indicatorReportRoute);
app.use('/api/userTypes', userTypesRoute);
app.use('/api/profile', profileRoute);
app.use('/api/dynamicClassInstances', dynamicClassInstancesRoute);
app.use('/api/themes', themesRoute);
app.use('/api/theme', themeRoute);
app.use('/api/groups', groupsRoute);
app.use('/api/group', groupRoute);
app.use('/api/codes', codesRoute);
app.use('/api/code', codeRoute);
app.use('/api/characteristics', characteristicsRoute);
app.use('/api/characteristic', characteristicRoute);





initUserAccounts();
addSuperPassword();
initStreetTypes();
initStreetDirections();

app.use(errorHandler);


process.env.TZ = 'America/Toronto';

module.exports = app;
