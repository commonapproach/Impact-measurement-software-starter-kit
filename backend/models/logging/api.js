const mongoose = require('mongoose');

// const MDBApiReqModel = mongoose.model('apiReq', new mongoose.Schema({
//   url: {type: String, required: true},
//   body: {type: Object, required: false},
//   date: {type: Date, required: true}
// }));
//
// const MDBApiResModel = mongoose.model('apiRes', new mongoose.Schema({
//   success: {type: Boolean, required: true},
//   message: {type: String, required: false},
//   body: {type: Object, required: false},
//   date: {type: Date, required: true}
// }));

const MDBApiModel = mongoose.model('api', new mongoose.Schema({
  req: {type: Object, required: true},
  res: {type: Object, required: true},
  date: {type: Date, required: true}
}));

module.exports = {
  MDBApiModel,
}