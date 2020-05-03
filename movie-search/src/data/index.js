const key = '1dad9129'
const source = `https://www.omdbapi.com/?apikey=${key}`

export async function getData(request) {
  const response = await fetch(request)

  if (response.ok) return response.json()

  throw new Error(`${response.status} ${response.statusText}`)
}

export async function searchMoviesByTitle(title, page) {
  const request = `${source}&s=${title}&page=${page}`
  const response = await getData(request)

  if (response.Response === 'False')
    throw new Error(`No results for: "${title}"`)

  return response
}

export async function searchMovieById(id) {
  const request = `${source}&i=${id}`
  const response = await getData(request)
  return response
}

export function setImages(slides) {
  return Promise.all(
    slides.map(async slide => {
      const img = slide.querySelector('img')
      const src = img.getAttribute('srcForCheck')
      img.removeAttribute('srcForCheck')
      try {
        const response = await fetch(src, { mode: 'cors' })
        if (response.ok) {
          const blob = await response.blob()
          img.src = URL.createObjectURL(blob)
        } else {
          img.src = './assets/images/404-poster.jpg'
        }
      } catch (e) {
        img.src = './assets/images/404-poster.jpg'
      }

      return slide
    }),
  )
}
