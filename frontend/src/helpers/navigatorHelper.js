

export function navigateHelper(navigator) {
  function navigate(link) {
    navigator(process.env.PUBLIC_URL + link)
  }
  return navigate
}