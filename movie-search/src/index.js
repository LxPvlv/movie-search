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
const micButton = searchForm.querySelector('#search-mic')
const keyboardButton = searchForm.querySelector('.search-keyboard')
const inputSpinner = searchForm.querySelector('#input-spinner')
const swiperContainer = document.querySelector('#swiper-container')
const swiperSpinnerContainer = document.querySelector(
  '#swiper-spinner-container',
)
const keyboardElement = document.querySelector('#keyboard')

let handleSubmit

micButton.addEventListener('click', () => {
  const SR = window.webkitSpeechRecognition || window.SpeechRecognition
  if (!SR) return

  const recognition = new SR()
  recognition.lang = 'en-En'
  micButton.classList.add('search-mic_active')

  recognition.addEventListener('result', recognitionEvent => {
    searchInput.value = recognitionEvent.results[0][0].transcript
    micButton.classList.remove('search-mic_active')
  })

  recognition.addEventListener('error', () => {
    micButton.classList.remove('search-mic_active')
  })

  recognition.start()
})

let removeKeyboardListeners
let isKeyboardOpen = false
keyboardButton.addEventListener('click', () => {
  if (isKeyboardOpen) {
    removeKeyboardListeners()
    keyboardElement.innerHTML = ''
    keyboardElement.setAttribute('class', 'keyboard keyboard_hidden')
    isKeyboardOpen = false
  } else {
    removeKeyboardListeners = keyboard({
      keyboardElement,
      searchInput,
      handleSubmit,
      escHandler: () => keyboardButton.click(),
    })
    isKeyboardOpen = true
    keyboardElement.classList.remove('keyboard_hidden')
  }
})

const state = {
  page: 0,
  totalResults: undefined,
  currentSwiperQuery: '',
}

const movieSwiper = new Swiper(swiperContainer, {
  init: false,
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
    360: {
      slidesPerView: 2,
    },
    700: {
      slidesPerView: 3,
    },
    1000: {
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

  if (!movies.Search) throw Error('Cannot get movies')

  return Promise.all(movies.Search.map(({ imdbID }) => searchMovieById(imdbID)))
}

function animateImages(newSlides, newQuery) {
  const oldActiveImages = swiperContainer.querySelectorAll(
    '.swiper-slide-visible .movie__img',
  )

  if (newQuery && movieSwiper.slides.length) {
    const oldSlidesLength = oldActiveImages.length
    const newSlidesLength = newSlides.length

    Array(Math.max(oldSlidesLength, newSlidesLength))
      .fill(0)
      .forEach((_, id) => {
        const slide = newSlides[id]
        let imgContainer
        if (slide) imgContainer = slide.querySelector('.movie__img-container')

        if (id < newSlidesLength) {
          const newImg = imgContainer.querySelector('.movie__img')
          newImg.classList.add('movie__img_fade-in')
          newImg.onanimationend = e =>
            e.target.classList.remove('movie__img_fade-in')
        }

        let oldImg
        if (id < oldSlidesLength) {
          oldImg = oldActiveImages[id]
          oldImg.classList.add('movie__img_fade-out')
          oldImg.onanimationend = e => e.target.remove()
        }

        if (slide && oldImg) {
          imgContainer.append(oldImg)
        }
      })
  }
}

async function renderSlides(results, newQuery) {
  if (results.length) {
    const slides = results.map(result => {
      return movieTemplate(result)
    })

    const slidesWithImages = await setImages(slides)

    animateImages(slidesWithImages, newQuery)

    if (newQuery) {
      movieSwiper.removeAllSlides()
      movieSwiper.update()
    }

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

handleSubmit = e => {
  if (e) e.preventDefault()

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
  try {
    showLoader(swiperSpinnerContainer)

    const value = 'slider'
    const results = await getSlides(value, true)
    await renderSlides(results, true)
    state.currentSwiperQuery = value

    swiperSpinnerContainer.classList.remove('swiper-spinner-container_init')
    swiperContainer.append(swiperSpinnerContainer)
  } catch (err) {
    messageField.innerHTML = err.message
  } finally {
    hideLoader(swiperSpinnerContainer)
  }
})

movieSwiper.init()
