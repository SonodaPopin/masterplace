import { Link, Route, Routes } from 'react-router-dom'
import RegistroCliente from './features/cuentas/RegistroCliente'
import RegistroMaestro from './features/cuentas/RegistroMaestro'
import IniciarSesion from './features/cuentas/IniciarSesion'
import Busqueda from './features/busqueda/Busqueda'
import PanelModeracion from './features/admin/PanelModeracion'
import Conversacion from './features/contacto/Conversacion'
import NuevaResena from './features/resenas/NuevaResena'
import EstadoSesion from './components/EstadoSesion'

// Rutas del flujo principal (MVP Must). Cada página indica su responsable.
export default function App() {
  return (
    <div className="contenedor">
      <header>
        <h1>MasterPlace</h1>
        <nav aria-label="Principal">
          <ul>
            <li><Link to="/">Buscar maestros</Link></li>
            <li><Link to="/registro/cliente">Registro cliente</Link></li>
            <li><Link to="/registro/maestro">Registro maestro</Link></li>
            <li><Link to="/admin">Moderación</Link></li>
          </ul>
        </nav>
        <EstadoSesion />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Busqueda />} />
          <Route path="/registro/cliente" element={<RegistroCliente />} />
          <Route path="/registro/maestro" element={<RegistroMaestro />} />
          <Route path="/ingresar" element={<IniciarSesion />} />
          <Route path="/admin" element={<PanelModeracion />} />
          <Route path="/contactos/:contactoId" element={<Conversacion />} />
          <Route path="/contactos/:contactoId/resena" element={<NuevaResena />} />
        </Routes>
      </main>
    </div>
  )
}
