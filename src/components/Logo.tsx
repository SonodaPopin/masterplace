// Marca de MasterPlace: un punto de ubicación (cercanía, CI-1) con un visto (verificación).
export function MarcaLogo({ tamano = 32 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="var(--color-primario)" />
      <path d="M16 6c-4.4 0-8 3.4-8 7.7 0 5.6 8 12.3 8 12.3s8-6.7 8-12.3C24 9.4 20.4 6 16 6z" fill="var(--color-acento)" />
      <path
        d="M12.6 13.6l2.4 2.4 4.4-4.6"
        fill="none"
        stroke="var(--color-primario)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Logo() {
  return (
    <span className="logo">
      <MarcaLogo />
      <span className="logo-texto">
        Master<span>Place</span>
      </span>
    </span>
  )
}
