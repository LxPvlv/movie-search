const key = '1dad9129'
const source = `http://www.omdbapi.com/?apikey=${key}`

export async function getData(request) {
  const response = await fetch(request)
  return response.json()
}

export async function searchMoviesByTitle(title) {
  const request = `${source}&s=${title}`
  const response = await getData(request)
  return response.Search
}

export async function searchMovieById(id) {
  const request = `${source}&i=${id}`
  const response = await getData(request)
  return response
}
