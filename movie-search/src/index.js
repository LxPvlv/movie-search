import './assets/styles/main.scss'
import '../node_modules/swiper/css/swiper.min.css'

import Swiper from 'swiper'
import {
  searchMoviesByTitle,
  searchMovieById,
  translate,
  NetworkError,
  ImdbDataError,
} from './data'
import { movieTemplate } from './templates'
import keyboard from './keyboard'

const state = {
  page: 0,
  totalResults: undefined,
  currentSwiperQuery: '',
}

class App {
  constructor() {
    this.searchForm = document.querySelector('#search-form')
    this.messageField = document.querySelector('#message-field')
    this.searchInput = this.searchForm.querySelector('#search-input')
    this.clearInputButton = this.searchForm.querySelector('#clear-input')
    this.micButton = this.searchForm.querySelector('#search-mic')
    this.keyboardButton = this.searchForm.querySelector('.search-keyboard')
    this.inputSpinner = this.searchForm.querySelector('#input-spinner')
    this.swiperContainer = document.querySelector('#swiper-container')
    this.swiperSpinnerContainer = document.querySelector(
      '#swiper-spinner-container',
    )
    this.keyboardElement = document.querySelector('#keyboard')

    this.isKeyboardOpen = false
  }

  init() {
    this.initSlider()
    this.initSpeechRecognition()
    this.initVirtualKeyboard()

    this.searchInput.focus()

    this.searchForm.addEventListener('submit', this.handleSubmit.bind(this))

    this.clearInputButton.addEventListener('click', () => {
      this.searchInput.value = ''
      this.messageField.innerHTML = ''
    })
  }

  initSlider() {
    this.movieSwiper = new Swiper(this.swiperContainer, {
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

    this.movieSwiper.on('reachEnd', () => {
      const swiperLength = this.movieSwiper.slides.length
      if (swiperLength && swiperLength !== state.totalResults) {
        App.showLoader(this.swiperSpinnerContainer)
        this.addSlides().then(() => App.hideLoader(this.swiperSpinnerContainer))
      }
    })

    this.movieSwiper.on('init', async () => {
      try {
        App.showLoader(this.swiperSpinnerContainer)

        const value = 'slider'
        const results = await this.getSlides(value, true)
        await this.renderSlides(results, true)
        state.currentSwiperQuery = value

        this.swiperSpinnerContainer.classList.remove(
          'swiper-spinner-container_init',
        )
        this.swiperContainer.append(this.swiperSpinnerContainer)
      } finally {
        App.hideLoader(this.swiperSpinnerContainer)
      }
    })

    this.movieSwiper.init()
  }

  initSpeechRecognition() {
    this.micButton.addEventListener('click', () => {
      const SR = window.webkitSpeechRecognition || window.SpeechRecognition
      if (!SR) return

      const recognition = new SR()
      recognition.lang = 'en-En'
      this.micButton.classList.add('search-mic_active')

      recognition.addEventListener('result', recognitionEvent => {
        this.searchInput.value = recognitionEvent.results[0][0].transcript
        this.micButton.classList.remove('search-mic_active')
      })

      recognition.addEventListener('error', () => {
        this.micButton.classList.remove('search-mic_active')
      })

      recognition.start()
    })
  }

  initVirtualKeyboard() {
    this.keyboardButton.addEventListener('click', () => {
      if (this.isKeyboardOpen) {
        this.removeKeyboardListeners()
        this.keyboardElement.innerHTML = ''
        this.keyboardElement.setAttribute('class', 'keyboard keyboard_hidden')
        this.isKeyboardOpen = false
      } else {
        this.removeKeyboardListeners = keyboard({
          keyboardElement: this.keyboardElement,
          searchInput: this.searchInput,
          handleSubmit: this.handleSubmit.bind(this),
          escHandler: () => this.keyboardButton.click(),
        })
        this.isKeyboardOpen = true
        this.keyboardElement.classList.remove('keyboard_hidden')
      }
    })
  }

  handleSubmit(e) {
    if (e) e.preventDefault()

    if (this.searchInput.value === '') return

    App.showLoader(this.inputSpinner)
    this.addSlides(true).then(() => App.hideLoader(this.inputSpinner))
  }

  hasMoreSlides() {
    const { totalResults } = state
    const swiperLength = this.movieSwiper.slides.length
    return swiperLength < totalResults
  }

  async getSlides(search, newQuery) {
    const nextPage = newQuery ? 1 : state.page + 1
    try {
      const movies = await searchMoviesByTitle(search, nextPage)

      state.totalResults = Number(movies.totalResults)

      if (!movies.Search) throw Error('Cannot get movies')

      return Promise.all(
        movies.Search.map(({ imdbID }) => searchMovieById(imdbID)),
      )
    } catch (err) {
      if (err instanceof NetworkError) {
        this.messageField.innerHTML = 'Sorry something went wrong'
        return []
      }
      if (err instanceof ImdbDataError) {
        if (err.message === 'Too many results.')
          this.messageField.innerHTML = `Too many results for: "${search}"`
        if (err.message === 'Movie not found!')
          this.messageField.innerHTML = `No results for: "${search}"`
        else this.messageField.innerHTML = err.message
        return []
      }

      this.messageField.innerHTML = err.message
      throw err
    }
  }

  animateImages(newSlides, newQuery) {
    const oldActiveImages = this.swiperContainer.querySelectorAll(
      '.swiper-slide-visible .movie__img',
    )

    if (newQuery && this.movieSwiper.slides.length) {
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

  async renderSlides(results, newQuery) {
    if (results.length) {
      const slides = results.map(result => {
        return movieTemplate(result)
      })

      const slidesWithImages = await App.setImages(slides)

      this.animateImages(slidesWithImages, newQuery)

      if (newQuery) {
        this.movieSwiper.removeAllSlides()
        this.movieSwiper.update()
      }

      this.movieSwiper.appendSlide(slidesWithImages)
      this.movieSwiper.update()
      state.page = newQuery ? 1 : state.page + 1
    }
  }

  async addSlides(newQuery = false) {
    let value = newQuery ? this.searchInput.value : state.currentSwiperQuery

    if (value === '') return
    if (newQuery) this.messageField.innerHTML = ''

    if (value.match(/[А-Яа-я]/)) {
      value = await translate(value)
      this.messageField.innerHTML = `Showing results for: "${value}"`
    }

    if (!newQuery && !this.hasMoreSlides()) return

    try {
      const results = await this.getSlides(value, newQuery)

      this.renderSlides(results, newQuery)

      state.currentSwiperQuery = value
    } catch (err) {
      this.messageField.innerHTML = err.message
    }
  }

  static showLoader(spinner) {
    spinner.classList.remove('hidden')
  }

  static hideLoader(spinner) {
    spinner.classList.add('hidden')
  }

  static setImages(slides) {
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
}

const app = new App()
app.init()
