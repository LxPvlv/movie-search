/* eslint-disable max-classes-per-file */
const KEY = '1dad9129'
const SOURCE = `https://www.omdbapi.com/?apikey=${KEY}`

export class NetworkError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

export class ImdbDataError extends Error {
  /* */
}

export async function getData(request, options) {
  const response = await fetch(request, options)

  if (response.ok) return response

  if (response.status === 401) return response

  throw new NetworkError(response.status, response.statusText)
}

export const getJsonData = request =>
  getData(request).then(response => response.json())

const getImdbData = async (...args) => {
  const response = await getJsonData(...args)

  if (response.Response === 'False') {
    throw new ImdbDataError(response.Error)
  }

  return response
}

export const searchMoviesByTitle = (title, page) =>
  getImdbData(`${SOURCE}&s=${title}&page=${page}`)

export const searchMovieById = id => getImdbData(`${SOURCE}&i=${id}`)
