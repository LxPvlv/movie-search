const TRANSLATE_KEY =
  'trnsl.1.1.20200503T234623Z.cdf30634946baaaf.0a1a78df29b4d4fe88f10ad19d6a89d095c27de5'
const TRANSLATE_SOURCE = `https://translate.yandex.net/api/v1.5/tr.json/translate?lang=ru-en&key=${TRANSLATE_KEY}`

export async function translate(input) {
  try {
    const response = await fetch(`${TRANSLATE_SOURCE}&text=${input}`)
    const jsonResponse = await response.json()
    return jsonResponse.text[0]
  } catch (e) {
    return input
  }
}
