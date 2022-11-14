
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

module.exports = {userTypeURI2UserType, userType2UserTypeURI};