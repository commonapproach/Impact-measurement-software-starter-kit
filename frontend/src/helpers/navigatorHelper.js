

export function navigateHelper(navigator) {
  function navigate(link) {
    console.log('here')
    navigator(process.env.PUBLIC_URL + link)
  }
  return navigate
}
export function navigate(){}