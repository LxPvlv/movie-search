export const movieTemplate = ({ Title, Poster, Year, imdbRating }) => {
  const src = Poster !== 'N/A' ? Poster : './assets/images/no-poster.jpg'
  const movie = document.createElement('div')
  movie.setAttribute('class', 'swiper-slide')
  movie.innerHTML = `
<h2 class="movie__title">${Title}</h2>
<img class="movie__img" srcForCheck="${src}"/>
<div class="movie__rating">
  <img src="./assets/images/rating-star.svg">
  <span>${imdbRating}</span>
</div>
<div class="movie__year">${Year}</div>
`
  return movie
}
