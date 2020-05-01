import './assets/styles/main.scss'
import '../node_modules/swiper/css/swiper.min.css'

import Swiper from 'swiper'
import { searchMoviesByTitle, searchMovieById } from './data'
import { movieTemplate } from './templates'

const searchForm = document.querySelector('#search-form')
const messageField = document.querySelector('#message-field')
const searchInput = searchForm.querySelector('#search-input')

const state = {
  page: 0,
  totalResults: undefined,
  currentSwiperQuery: '',
}

const movieSwiper = new Swiper('.swiper-container', {
  grabCursor: true,
  scrollbar: {
    el: '.swiper-scrollbar',
    draggable: true,
  },
  keyboard: {
    enabled: true,
    onlyInViewport: true,
  },
  watchSlidesProgress: true,
  watchSlidesVisibility: true,
  slidesPerView: 4,
  spaceBetween: 10,
  pagination: {
    el: '.swiper-pagination',
    type: 'fraction',
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  breakpoints: {
    220: {
      slidesPerView: 1,
    },
    480: {
      slidesPerView: 3,
    },
    640: {
      slidesPerView: 4,
    },
  },
})

function hasMoreSlides() {
  const { totalResults } = state
  const swiperLength = movieSwiper.slides.length
  return swiperLength < totalResults
}

async function getSlides(search, newQuery) {
  const nextPage = newQuery ? 1 : state.page + 1
  const movies = await searchMoviesByTitle(search, nextPage)

  state.totalResults = Number(movies.totalResults)

  return Promise.all(movies.Search.map(({ imdbID }) => searchMovieById(imdbID)))
}

async function addSlides(newQuery = false) {
  const value = newQuery ? searchInput.value : state.currentSwiperQuery

  if (value === '') return

  if (!newQuery && !hasMoreSlides()) return

  try {
    const results = await getSlides(value, newQuery)

    if (results.length) {
      if (newQuery) {
        movieSwiper.removeAllSlides()
        movieSwiper.update()
        state.currentSwiperQuery = value
        messageField.innerHTML = ''
      }

      const slides = results.map(result => {
        return movieTemplate(result)
      })

      movieSwiper.appendSlide(slides)
      movieSwiper.update()
      state.page = newQuery ? 1 : state.page + 1
    }
  } catch (err) {
    messageField.innerHTML = err.message
  }
}

function handleSubmit(e) {
  e.preventDefault()
  addSlides(true)
}

searchForm.addEventListener('submit', handleSubmit)

movieSwiper.on('reachEnd', () => {
  const swiperLength = movieSwiper.slides.length
  if (swiperLength) addSlides()
})
