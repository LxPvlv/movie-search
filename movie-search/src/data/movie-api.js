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

export function setImages(slides) {
  return Promise.all(
    slides.map(slide => {
      return new Promise(resolve => {
        const img = slide.querySelector('img')
        const { src } = img.dataset
        img.removeAttribute('data-src')
        img.onload = () => resolve(slide)
        img.onerror = () => {
          img.src = './assets/images/404-poster.jpg'
          resolve(slide)
        }
        img.src = src
      })
    }),
  )
}
