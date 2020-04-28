import './assets/styles/main.scss'

import { searchMoviesByTitle, searchMovieById } from './data'
import { movieTemplate } from './templates'

const carousel = document.querySelector('.movie__carousel')

searchMoviesByTitle('title').then(movies => {
  Promise.all(movies.map(({ imdbID }) => searchMovieById(imdbID))).then(
    results => {
      results.forEach(result => {
        const movieElement = movieTemplate(result)
        carousel.append(movieElement)
      })
    },
  )
})
