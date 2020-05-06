const KEY = '1dad9129'
const SOURCE = `https://www.omdbapi.com/?apikey=${KEY}`

export async function getData(request, options) {
  const response = await fetch(request, options)

  if (response.ok) return response

  throw new Error(`${response.status} ${response.statusText}`)
}

export const getJsonData = request =>
  getData(request)
    .then(response => response.json())
    .catch(err => ({ Response: 'False', Error: err }))

export async function searchMoviesByTitle(title, page) {
  const response = await getJsonData(`${SOURCE}&s=${title}&page=${page}`)

  if (response.Response === 'False') {
    if (response.Error === 'Too many results.')
      throw new Error(`Too many results for: "${title}"`)
    if (response.Error === 'Movie not found!')
      throw new Error(`No results for: "${title}"`)
  }

  return response
}

export const searchMovieById = id => getJsonData(`${SOURCE}&i=${id}`)

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
