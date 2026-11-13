import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { tituloDeRuta } from '../lib/navegacion/titulos'

// RNF-7 / TNF-06: en una SPA el navegador no avisa del cambio de página. Al cambiar de ruta se actualiza el
// título y el foco pasa al h1 de la página (o al <main> si no hay), para que el lector de pantalla la anuncie y
// el teclado siga desde el contenido nuevo. No actúa en la carga inicial ni cuando solo cambian los filtros (?…).
export default function AnunciarPagina() {
  const { pathname } = useLocation()
  // Ruta ya anunciada: evita mover el foco en la carga inicial (también con el doble efecto de StrictMode).
  const anterior = useRef(pathname)

  useEffect(() => {
    document.title = tituloDeRuta(pathname)
    if (anterior.current === pathname) return
    anterior.current = pathname
    // Esperar a que la página nueva pinte su h1.
    const espera = setTimeout(() => {
      const main = document.getElementById('contenido')
      if (!main || main.contains(document.activeElement)) return
      const h1 = main.querySelector<HTMLElement>('h1')
      if (h1) {
        if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1')
        h1.focus()
      } else {
        main.focus()
      }
    }, 0)
    return () => clearTimeout(espera)
  }, [pathname])

  return null
}
