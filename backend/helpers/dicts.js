
const userTypeURI2UserType = {
  ':superuser': 'superuser',
  ':admin': 'admin',
  ':groupAdmin': 'groupAdmin',
  ':editor': 'editor',
  ':reporter': 'reporter',
  ':researcher': 'researcher'
}

const userType2UserTypeURI = {
  'superuser': ':superuser',
  'admin': ':admin',
  'groupAdmin': ':groupAdmin',
  'editor': ':editor',
  'reporter': ':reporter',
  'researcher': ':researcher'
}

const genderOptions = [
  'Female',
  'Male',
  'Other'
]


module.exports = {genderOptions,userTypeURI2UserType, userType2UserTypeURI};