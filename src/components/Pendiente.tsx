import Icono from './Icono'

type Props = { titulo: string; requisito: string; responsable: string; detalle?: string }

// Marcador temporal: cada responsable lo reemplaza por la pantalla real.
export default function Pendiente({ titulo, requisito, responsable, detalle }: Props) {
  return (
    <section className="pendiente" aria-labelledby="titulo-pendiente">
      <span className="pendiente-icono">
        <Icono nombre="construccion" tamano={28} />
      </span>
      <p className="chip">En construcción · {requisito}</p>
      <h1 id="titulo-pendiente">{titulo}</h1>
      {detalle && <p className="pendiente-detalle">{detalle}</p>}
      <p className="pendiente-responsable">Responsable: {responsable}</p>
    </section>
  )
}
