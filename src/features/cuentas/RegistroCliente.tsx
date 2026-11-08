import Pendiente from '../../components/Pendiente'

export default function RegistroCliente() {
  return (
    <Pendiente
      titulo="Registro de cliente"
      requisito="RF-10"
      responsable="Gabriel"
      detalle="Formulario con nombre, correo, comuna y contraseña usando Supabase Auth. Ver docs/equipo/gabriel.md."
    />
  )
}
