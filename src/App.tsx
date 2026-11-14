import { Route, Routes } from 'react-router-dom'
import RegistroCliente from './features/cuentas/RegistroCliente'
import RegistroMaestro from './features/cuentas/RegistroMaestro'
import IniciarSesion from './features/cuentas/IniciarSesion'
import Busqueda from './features/busqueda/Busqueda'
import PanelModeracion from './features/admin/PanelModeracion'
import Conversacion from './features/contacto/Conversacion'
import NuevaResena from './features/resenas/NuevaResena'
import PaginaPrueba from './features/validacion/PaginaPrueba'
import PanelPrueba from './features/validacion/PanelPrueba'
import ProveedorPrueba from './features/validacion/ProveedorPrueba'
import Encabezado from './components/Encabezado'
import PiePagina from './components/PiePagina'
import AnunciarPagina from './components/AnunciarPagina'
import BandejaContactos from './features/contacto/BandejaContactos'

// Rutas del flujo principal (MVP Must). Cada página indica su responsable.
export default function App() {
  return (
    <ProveedorPrueba>
      <div className="app">
        <AnunciarPagina />
        <a href="#contenido" className="saltar-contenido">
          Saltar al contenido
        </a>
        <Encabezado />
        <main id="contenido" className="contenido" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Busqueda />} />
            <Route path="/registro/cliente" element={<RegistroCliente />} />
            <Route path="/registro/maestro" element={<RegistroMaestro />} />
            <Route path="/ingresar" element={<IniciarSesion />} />
            <Route path="/admin" element={<PanelModeracion />} />
            <Route path="/contactos/:contactoId" element={<Conversacion />} />
            <Route path="/contactos/:contactoId/resena" element={<NuevaResena />} />
            <Route path="/contactos" element={<BandejaContactos />} />
            <Route path="/prueba/:token" element={<PaginaPrueba />} />
          </Routes>
        </main>
        <PiePagina />
        {/* Validación con usuarios: solo aparece con un enlace /prueba/<token> activo y durante una tarea. */}
        <PanelPrueba />
      </div>
    </ProveedorPrueba>
  )
}
