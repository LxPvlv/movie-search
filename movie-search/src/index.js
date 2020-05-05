import './assets/styles/main.scss'
import '../node_modules/swiper/css/swiper.min.css'

import Swiper from 'swiper'
import {
  searchMoviesByTitle,
  searchMovieById,
  setImages,
  translate,
} from './data'
import { movieTemplate } from './templates'
import keyboard from './keyboard'

const searchForm = document.querySelector('#search-form')
const messageField = document.querySelector('#message-field')
const searchInput = searchForm.querySelector('#search-input')
const clearInputButton = searchForm.querySelector('#clear-input')
const keyboardButton = searchForm.querySelector('.search-keyboard')
const inputSpinner = searchForm.querySelector('#input-spinner')
const swiperContainer = document.querySelector('#swiper-container')
const swiperSpinnerContainer = document.querySelector(
  '#swiper-spinner-container',
)
const keyboardElement = document.querySelector('#keyboard')

let removeKeyboardListeners
let isKeyboardOpen = false
keyboardButton.addEventListener('click', () => {
  if (isKeyboardOpen) {
    removeKeyboardListeners()
    keyboardElement.innerHTML = ''
    keyboardElement.setAttribute('class', 'keyboard keyboard_hidden')
    isKeyboardOpen = false
  } else {
    removeKeyboardListeners = keyboard(keyboardElement, searchInput)
    isKeyboardOpen = true
    keyboardElement.classList.remove('keyboard_hidden')
  }
})

const state = {
  page: 0,
  totalResults: undefined,
  currentSwiperQuery: '',
}

const movieSwiper = new Swiper('.swiper-container', {
  init: false,
  updateOnWindowResize: true,
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
  centerInsufficientSlides: true,
  pagination: {
    el: '.swiper-pagination',
    type: 'custom',
    renderCustom(swiper, current) {
      if (state.totalResults && swiper.slides.length)
        return `${current} of ${state.totalResults}`
      return ''
    },
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

function showLoader(spinner) {
  spinner.classList.remove('hidden')
}
function hideLoader(spinner) {
  spinner.classList.add('hidden')
}

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

async function renderSlides(results, newQuery) {
  if (results.length) {
    if (newQuery) {
      movieSwiper.removeAllSlides()
      movieSwiper.update()
    }

    const slides = results.map(result => {
      return movieTemplate(result)
    })

    const slidesWithImages = await setImages(slides)

    movieSwiper.appendSlide(slidesWithImages)
    movieSwiper.update()
    state.page = newQuery ? 1 : state.page + 1
  }
}

async function addSlides(newQuery = false) {
  let value = newQuery ? searchInput.value : state.currentSwiperQuery

  if (value === '') return
  if (newQuery) messageField.innerHTML = ''

  if (value.match(/[А-Яа-я]/)) {
    value = await translate(value)
    messageField.innerHTML = `Showing results for: "${value}"`
  }

  if (!newQuery && !hasMoreSlides()) return

  try {
    const results = await getSlides(value, newQuery)

    renderSlides(results, newQuery)

    state.currentSwiperQuery = value
  } catch (err) {
    messageField.innerHTML = err.message
  }
}

function handleSubmit(e) {
  e.preventDefault()
  if (searchInput.value === '') return

  showLoader(inputSpinner)
  addSlides(true).then(() => hideLoader(inputSpinner))
}

searchForm.addEventListener('submit', handleSubmit)

clearInputButton.addEventListener('click', () => {
  searchInput.value = ''
  messageField.innerHTML = ''
})

searchInput.focus()

movieSwiper.on('reachEnd', () => {
  const swiperLength = movieSwiper.slides.length
  if (swiperLength && swiperLength !== state.totalResults) {
    showLoader(swiperSpinnerContainer)
    addSlides().then(() => hideLoader(swiperSpinnerContainer))
  }
})

movieSwiper.on('init', async () => {
  showLoader(swiperSpinnerContainer)

  const value = 'slider'
  const results = await getSlides(value, true)
  await renderSlides(results, true)
  state.currentSwiperQuery = value

  hideLoader(swiperSpinnerContainer)

  swiperContainer.append(swiperSpinnerContainer)
  swiperSpinnerContainer.classList.remove('swiper-spinner-container_init')
})

movieSwiper.init()
