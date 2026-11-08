import Pendiente from '../../components/Pendiente'

export default function IniciarSesion() {
  return (
    <Pendiente
      titulo="Iniciar sesión"
      requisito="RF-10"
      responsable="Gabriel"
      detalle="Correo y contraseña con Supabase Auth."
    />
  )
}
