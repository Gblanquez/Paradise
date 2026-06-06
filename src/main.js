import './styles/style.css'
import './taxi/transition.js'


if (CSS && 'paintWorklet' in CSS) {
    CSS.paintWorklet.addModule('https://unpkg.com/smooth-corners');
  }


console.log('smooth-corners added')


