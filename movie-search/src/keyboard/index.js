import codes from './codes'

export default function (keyboardElement, inputElement) {
  const textElement = inputElement
  const keyboard = keyboardElement

  const crossBrowserCode = code => ({ OSLeft: 'MetaLeft' }[code] || code)

  const language = localStorage.getItem('keyboard-lang') || 'en'

  let capsLocked = false
  const shiftPressed = { left: false, right: false }

  /* ********* CREATE KEYBOARD ********* */

  const createElementWithClass = (el, ...classes) => {
    const newEl = document.createElement(el)
    newEl.classList.add(...classes)
    return newEl
  }

  const addGlyphs = ({ code, layout, label }) => {
    const pictContainer = createElementWithClass('div', 'pict-container')
    pictContainer.setAttribute('id', code)

    const fragment = document.createDocumentFragment()

    if (layout) {
      Object.keys(layout).forEach(lang => {
        const langElement = createElementWithClass('div', lang)
        pictContainer.classList.add('printable')

        langElement.innerHTML = `
      <span class='${lang}-upper'>${layout[lang][0]}</span>
      <span class='${lang}-lower'>${layout[lang][1]}</span>
      `
        fragment.append(langElement)
      })
    }

    if (label) {
      const labelElement = createElementWithClass('div', 'label')

      labelElement.innerHTML = label
      fragment.append(labelElement)
    }

    pictContainer.append(fragment)

    return pictContainer
  }

  keyboard.classList.add(language)
  keyboard.classList.add('lower')

  codes.forEach(row => {
    const keyboardRow = createElementWithClass('div', 'row')

    row.forEach(({ type, ...rest }) => {
      const keyContainer = createElementWithClass(
        'div',
        'key-container',
        type === 's' ? 'key-square' : 'key-rectangle',
      )
      if (type === 'r') keyContainer.setAttribute('id', `layout-${rest.code}`)

      keyContainer.append(addGlyphs(rest))

      keyboardRow.append(keyContainer)
    })
    keyboard.append(keyboardRow)
  })

  /* ********* KEY HANDLERS ********* */

  const changeLayout = () => {
    keyboard.classList.toggle('en')
    keyboard.classList.toggle('ru')
    localStorage.setItem(
      'keyboard-lang',
      localStorage.getItem('keyboard-lang') === 'ru' ? 'en' : 'ru',
    )
  }

  const toggleShift = (leftRight, on) => {
    if (!on && !shiftPressed.left && !shiftPressed.right) return
    shiftPressed[leftRight] = on

    if (on && shiftPressed.left && shiftPressed.right) return
    if (!on && (shiftPressed.left || shiftPressed.right)) return

    keyboard.classList.toggle('upper')
    keyboard.classList.toggle('lower')
  }

  const toggleCapsLock = () => {
    const capsKey = keyboard.querySelector('#CapsLock')
    capsKey.classList.toggle('key-lock')
    capsLocked = !capsLocked
    keyboard.classList.toggle('upper')
    keyboard.classList.toggle('lower')
  }

  const handlerPrintKey = pictContainer => {
    let text
    switch (pictContainer.id) {
      case 'Space':
        text = ' '
        break
      case 'Tab':
        text = '\t'
        break
      case 'Enter':
        text = '\n'
        break
      default:
        text = pictContainer.innerText
    }

    const { selectionStart, selectionEnd, value } = textElement
    const edited =
      value.slice(0, selectionStart) + text + value.slice(selectionEnd)
    textElement.value = edited
    textElement.focus()
    textElement.selectionStart = selectionStart + 1
    textElement.selectionEnd = selectionStart + 1
  }

  const handleRemoveKeys = code => {
    const { value } = textElement
    let { selectionStart, selectionEnd } = textElement

    if (selectionStart === selectionEnd) {
      switch (code) {
        case 'Backspace':
          if (selectionStart) selectionStart -= 1
          break
        case 'Delete':
          selectionEnd += 1
          break
        default:
          throw Error('Unexpected code')
      }
    }
    const removed = value.slice(0, selectionStart) + value.slice(selectionEnd)
    textElement.value = removed
    textElement.selectionStart = selectionStart
    textElement.selectionEnd = selectionStart
  }

  const handleArrowKeys = code => {
    const { selectionStart, value } = textElement
    let newPosition

    if (code === 'ArrowLeft') {
      newPosition = selectionStart && selectionStart - 1
    }

    if (code === 'ArrowRight') {
      newPosition = selectionStart + 1
    }

    let targetStart
    if (code === 'ArrowUp') {
      const targetEnd = value.lastIndexOf('\n', selectionStart - 1)
      if (targetEnd === -1) {
        newPosition = selectionStart
      } else {
        targetStart = value.lastIndexOf('\n', targetEnd - 1)
        const shift = selectionStart - targetEnd
        if (shift > targetEnd - targetStart) {
          newPosition = targetEnd
        } else {
          newPosition = targetStart + shift
        }
      }
    }

    if (code === 'ArrowDown') {
      let shift
      targetStart = value.indexOf('\n', selectionStart)
      if (selectionStart === 0) {
        shift = 0
        newPosition = targetStart + 1
      } else {
        shift = selectionStart - value.lastIndexOf('\n', selectionStart - 1) + 1
        if (targetStart === -1) {
          newPosition = selectionStart
        } else {
          let targetEnd = value.indexOf('\n', targetStart + 1)
          if (targetEnd === -1) targetEnd = value.length
          const targetLength = targetEnd - targetStart
          if (shift > targetLength) {
            newPosition = targetEnd
          } else {
            newPosition = targetStart + shift - 1
          }
        }
      }
    }

    textElement.selectionStart = newPosition
    textElement.selectionEnd = newPosition
  }

  const handleDown = code => {
    // handle print keys
    if (!code) return

    const keyElement = keyboard.querySelector(`#${code}`)
    if (!keyElement) return
    keyElement.classList.add('key-highlight')
    const ripple = createElementWithClass('div', 'ripple')
    ripple.addEventListener('animationend', e => e.target.remove())
    keyElement.parentElement.prepend(ripple)

    if (keyElement.classList.contains('printable')) {
      handlerPrintKey(keyElement)
    }

    // handle modifier keys
    if (code === 'MetaLeft') {
      changeLayout()
    }

    if (code === 'ShiftLeft' || code === 'ShiftRight') {
      toggleShift(code.slice(5).toLowerCase(), true)
    }

    if (code === 'CapsLock') {
      toggleCapsLock()
    }

    // handle navigation keys
    if (code === 'PageUp' || code === 'PageDown') {
      textElement.scrollBy(
        0,
        textElement.clientHeight * (code === 'PageUp' ? -1 : 1),
      )
    }

    if (code === 'Home' || code === 'End') {
      const { selectionStart, value } = textElement
      if (code === 'Home') {
        const position = value.lastIndexOf('\n', selectionStart - 1)
        const newPosition = position === -1 ? 0 : position + 1
        textElement.selectionStart = newPosition
        textElement.selectionEnd = newPosition
      }
      if (code === 'End') {
        const newPosition = value.indexOf('\n', selectionStart)
        textElement.selectionStart = newPosition
        textElement.selectionEnd = newPosition
      }
    }

    if (
      code === 'ArrowLeft' ||
      code === 'ArrowRight' ||
      code === 'ArrowUp' ||
      code === 'ArrowDown'
    ) {
      handleArrowKeys(code)
    }

    // handle remove keys
    if (code === 'Backspace' || code === 'Delete') {
      handleRemoveKeys(code)
    }
  }

  /* ********* EVENT LISTENERS ********* */

  const handleUp = e => {
    const code = crossBrowserCode(e.code)
    if (code === 'ShiftLeft' || code === 'ShiftRight') {
      toggleShift(code.slice(5).toLowerCase(), false)
    }

    const keyElement = keyboard.querySelector(`#${code}`)
    if (!keyElement) return
    keyElement.classList.remove('key-highlight')
  }

  let dropHandler
  const addDropHandlers = (lockedShift, keyElement) => {
    dropHandler = ({ code: dropKeyCode }) => {
      keyElement.classList.remove('key-lock')
      if (dropKeyCode === 'ShiftLeft' || dropKeyCode === 'ShiftRight') {
        handleDown({ code: lockedShift })
      } else {
        handleUp({ code: lockedShift })
      }

      keyboard.removeEventListener('mousedown', dropHandler)
    }

    keyboard.addEventListener('mousedown', dropHandler, {
      once: true,
    })
  }

  const addHighlight = e => {
    const keyElement = e.target
    if (!keyElement.classList.contains('pict-container')) return

    const code = keyElement.id
    if (code === 'ShiftLeft' || code === 'ShiftRight') {
      if (shiftPressed.left || shiftPressed.right) return
      keyElement.classList.add('key-lock')
      handleDown(code)

      addDropHandlers(code, keyElement)

      return
    }

    keyElement.classList.add('key-highlight')

    handleDown(code)
  }
  keyboard.addEventListener('mousedown', addHighlight)

  const removeHighlight = e => {
    const code = e.target.id
    if (!(code === 'PageUp' || code === 'PageDown')) {
      textElement.focus()
    }

    const pressedKeys = keyboard.querySelectorAll('.key-highlight')
    pressedKeys.forEach(key => {
      key.classList.remove('key-highlight')
    })
  }
  keyboard.addEventListener('mouseup', removeHighlight)

  const handleWindowBlur = () => {
    shiftPressed.left = false
    shiftPressed.right = false

    const keysPressed = keyboard.querySelectorAll('.key-highlight')
    if (keysPressed && keysPressed.length) {
      keysPressed.forEach(key => key.classList.remove('key-highlight'))
    }
  }
  window.addEventListener('blur', handleWindowBlur)

  const handleWindowFocus = () => {
    if (capsLocked) {
      keyboard.classList.add('upper')
      keyboard.classList.remove('lower')
    } else {
      keyboard.classList.remove('upper')
      keyboard.classList.add('lower')
    }
  }
  window.addEventListener('focus', handleWindowFocus)

  // remove listeners
  const removeKeyboardListeners = () => {
    keyboard.removeEventListener('mousedown', dropHandler)
    keyboard.removeEventListener('mousedown', addHighlight)
    keyboard.removeEventListener('mouseup', removeHighlight)
    window.removeEventListener('blur', handleWindowBlur)
    window.removeEventListener('focus', handleWindowFocus)
  }

  return removeKeyboardListeners
}
