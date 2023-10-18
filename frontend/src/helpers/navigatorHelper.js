

export function navigateHelper(navigator) {
  function navigate(link) {
    if (link === -1)
      navigator(-1)
    navigator(process.env.PUBLIC_URL + link)
  }
  return navigate
}