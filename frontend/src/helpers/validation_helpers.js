export function emailValidation(email) {
    if (email === '') {
      return null
    }
    const valid = email.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
    if (valid) {
      return "success"
    }
    else{
      return "error"
    }
}

export function isValidURL(url) {
  // Regular expression pattern for URL validation
  var urlPattern = /^(ftp|http|https):\/\/[^ "]+$/;

  // Test the input string against the pattern
  return urlPattern.test(url);
}

// export function postalCodeValidation(postalCode) {
//   if (postalCode === '') {
//     return null
//   }
//   // const valid = postalCode.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
//   //   if (valid) {
//   //     return "success"
//   //   }
//   //   else{
//   //     return "error"
//   //   }
// }
