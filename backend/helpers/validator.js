const {genderOptions} = require("./dicts");


const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const passwordRegex = /^.*(?=.{8,})((?=.*[!@#$%^&*()\-_=+{};:,<.>]){1})(?=.*\d)((?=.*[a-z]){1})((?=.*[A-Z]){1}).*$/;
const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;


const Validator = {
  email: email => {
    emailRegex.test(email);
  },

  gender: gender => {
    return !genderOptions.includes(gender);
  },

  password: password => {
    return passwordRegex.test(password);
  },


  postalCode: postalCode => {
    return !postalCodeRegex.test(postalCode);
  },


};

function isValidURL(uri) {
  const pattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
  return pattern.test(uri);
}

module.exports = {Validator, isValidURL};