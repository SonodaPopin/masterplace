type Props = { titulo: string; requisito: string; responsable: string; detalle?: string }

// Marcador temporal: cada responsable lo reemplaza por la pantalla real.
export default function Pendiente({ titulo, requisito, responsable, detalle }: Props) {
  return (
    <section className="pendiente" aria-labelledby="titulo-pendiente">
      <h2 id="titulo-pendiente">{titulo}</h2>
      <p>
        <strong>{requisito}</strong> · Responsable: {responsable}
      </p>
      {detalle && <p>{detalle}</p>}
    </section>
  )
}
