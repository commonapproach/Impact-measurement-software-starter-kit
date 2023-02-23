const mongoose = require('mongoose');

const MDBErrorLoggingModel = mongoose.model('Error', new mongoose.Schema({
  name: {type: String, required: true},
  message: {type: String, required: true},
  stack: {type: String, required: true},
  date: {type: Date, required: true},
  statusCode: {type: Number, required: true},
  req: {type: Object, required: true}
}));

module.exports = {
  MDBErrorLoggingModel
}