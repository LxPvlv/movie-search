export const movieTemplate = ({ Title, Poster, Year, imdbID, imdbRating }) => {
  const src = Poster !== 'N/A' ? Poster : './assets/images/no-poster.jpg'
  const movie = document.createElement('div')
  movie.setAttribute('class', 'swiper-slide')
  movie.innerHTML = `
<a class="movie__link" href="https://www.imdb.com/title/${imdbID}/videogallery/" target="blank">
  <h2 class="movie__title" title="${Title}">${Title}</h2>
</a>
<div class="movie__img-container">
  <img class="movie__img" data-src="${src}"/>
</div>
<div class="movie__rating">
  <img src="./assets/images/rating-star.svg">
  <span>${imdbRating}</span>
</div>
<div class="movie__year">${Year}</div>
`
  return movie
}
