// const { movieTemplate } = require('./src/templates')
import { movieTemplate } from './src/templates'

describe('test movieTemplate', () => {
  const templateResult = `<div class="swiper-slide">
<a class="movie__link" href="https://www.imdb.com/title/1111111/videogallery/" target="blank">
  <h2 class="movie__title" title="Title Movie">Title Movie</h2>
</a>
<div class="movie__img-container">
  <img class="movie__img" data-src="https://path.to/poster.jpg">
</div>
<div class="movie__rating">
  <img src="./assets/images/rating-star.svg">
  <span>10</span>
</div>
<div class="movie__year">2020</div>
</div>`

  let template
  beforeEach(() => {
    template = movieTemplate({
      Title: 'Title Movie',
      Poster: 'https://path.to/poster.jpg',
      Year: 2020,
      imdbID: '1111111',
      imdbRating: 10,
    })
  })

  it('movieTemplate returns defined result', () => {
    expect(template).toBeDefined()
  })

  it('movieTemplate returns Html template', () => {
    expect(template.outerHTML).toEqual(templateResult)
  })
})
