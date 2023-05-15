const {hasAccess} = require("../../helpers/hasAccess");
const {MDBFrontendErrorLoggingModel} = require("../../models/logging/errorLogging");

const frontendErrorReportHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'reportFrontendError'))
      return await frontendErrorReport(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
}

const frontendErrorReport = async (req, res) => {
  const userURI = req.session._uri;
  const e = req.body;
  const frontendErrorReport = new MDBFrontendErrorLoggingModel({
    ...e,
    userURI,
    date: new Date()
  })
  await frontendErrorReport.save()
  return res.status(200).json({success: true});
}


module.exports ={frontendErrorReportHandler}
