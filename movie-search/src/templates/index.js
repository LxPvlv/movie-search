export const movieTemplate = ({ Title, Poster, Year, Type, imdbRating }) => {
  const src = Poster !== 'N/A' ? Poster : './assets/images/404-poster.jpg'
  const movie = document.createElement('div')
  movie.setAttribute('class', 'movie')
  movie.innerHTML = `
<h2 class="movie__title">${Title}</h2>
<img class="movie__img" src="${src}"/>
<div class="movie__year">${Year}</div>
<div class="movie__type">${Type}</div>
<div class="movie__rating">${imdbRating}<div>
`
  return movie
}
