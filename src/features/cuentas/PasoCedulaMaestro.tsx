import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import Campo from '../../components/Campo'
import Icono from '../../components/Icono'
import { supabase } from '../../lib/supabase'
import { formatearRut } from '../../lib/rut/rut'
import { errorRutDesdeBase, prepararRut, rutAlSalir } from '../../lib/maestros/rutMaestro'
import {
  formatearTamano,
  mensajeErrorDatos,
  rutaCedula,
  TIPOS_CEDULA,
  validarArchivoCedula,
} from '../../lib/maestros/validacion'

type Props = {
  maestroId: string
  alVolver?: () => void
  alTerminar: () => void
  renovacion?: boolean
}

// RF-1 · Paso 3 de 3: RUT en `maestros_privado` (#62) y cédula al bucket privado «cedulas» con su fila en
// `documentos` (estado pendiente). El RUT y la cédula solo los ven su dueño y un administrador (RLS y Storage);
// la cédula se borra al aprobarla (RF-2). El RUT va aquí porque `maestros_privado` necesita la fila de `maestros`
// (paso 2) y porque el administrador lo compara con la cédula.
export default function PasoCedulaMaestro({ maestroId, alVolver, alTerminar, renovacion = false, }: Props) {
  const [rut, setRut] = useState('')
  // RUT ya guardado («12345678-5»): si el maestro recarga la página o vuelve, no se le pide de nuevo.
  const [rutGuardado, setRutGuardado] = useState<string | null>(null)
  const [cargandoRut, setCargandoRut] = useState(true)
  const [errorRut, setErrorRut] = useState<string | undefined>()
  // RUT que rechazó la base (p. ej. duplicado): su error se mantiene al salir del campo mientras no lo cambie.
  const [rechazoBase, setRechazoBase] = useState<{ rut: string; error: string } | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [acepta, setAcepta] = useState(false)
  const [errorArchivo, setErrorArchivo] = useState<string | undefined>()
  const [errorAcepta, setErrorAcepta] = useState<string | undefined>()
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let activo = true
    supabase
      .from('maestros_privado')
      .select('rut')
      .eq('id', maestroId)
      .maybeSingle()
      .then(({ data }) => {
        if (!activo) return
        if (data?.rut) {
          setRutGuardado(data.rut)
          setRut(formatearRut(data.rut))
        }
        setCargandoRut(false)
      })
    return () => {
      activo = false
    }
  }, [maestroId])

  // Vista previa local de la imagen (no sale del navegador hasta enviar).
  useEffect(() => {
    if (!archivo || !archivo.type.startsWith('image/')) {
      setVistaPrevia(null)
      return
    }
    const url = URL.createObjectURL(archivo)
    setVistaPrevia(url)
    return () => URL.revokeObjectURL(url)
  }, [archivo])

  function elegir(evento: ChangeEvent<HTMLInputElement>) {
    const elegido = evento.target.files?.[0] ?? null
    setArchivo(elegido)
    setErrorArchivo(elegido ? validarArchivoCedula(elegido) : undefined)
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErrorGeneral(null)

    const rutListo = prepararRut(rut)
    const eArchivo = validarArchivoCedula(archivo)
    const eAcepta = acepta ? undefined : 'Debes aceptar la revisión de tu cédula para continuar.'
    setErrorRut(rutListo.ok ? undefined : rutListo.error)
    setErrorArchivo(eArchivo)
    setErrorAcepta(eAcepta)
    if (!rutListo.ok || eArchivo || eAcepta || !archivo) {
      document.getElementById(!rutListo.ok ? 'rut' : eArchivo ? 'cedula' : 'acepta')?.focus()
      return
    }

    setEnviando(true)

    // 1. RUT (solo si cambió). Un RUT de otra cuenta lo rechaza el unique de la base (23505).
    if (rutListo.guardar !== rutGuardado) {
      const guardado = rutGuardado
        ? await supabase.from('maestros_privado').update({ rut: rutListo.guardar }).eq('id', maestroId)
        : await supabase.from('maestros_privado').insert({ id: maestroId, rut: rutListo.guardar })
      if (guardado.error) {
        setEnviando(false)
        const deRut = errorRutDesdeBase(guardado.error)
        if (deRut) {
          setErrorRut(deRut)
          setRechazoBase({ rut: rutListo.guardar, error: deRut })
          document.getElementById('rut')?.focus()
        } else {
          setErrorGeneral(mensajeErrorDatos(guardado.error.message))
        }
        return
      }
      setRutGuardado(rutListo.guardar)
    }
    setRut(rutListo.mostrar)

    // 2. Cédula
    const ruta = rutaCedula(maestroId, archivo.type)
    const subida = await supabase.storage
      .from('cedulas')
      .upload(ruta, archivo, { contentType: archivo.type, upsert: false })
    if (subida.error) {
      setEnviando(false)
      setErrorGeneral(mensajeErrorDatos(subida.error.message))
      return
    }

    const registro = await supabase
      .from('documentos')
      .insert({ maestro_id: maestroId, tipo: 'cedula', ruta_archivo: ruta })
    setEnviando(false)
    if (registro.error) {
      setErrorGeneral(mensajeErrorDatos(registro.error.message))
      return
    }
    alTerminar()
  }

  return (
    <form onSubmit={enviar} noValidate className="formulario">
      <p className="aviso aviso-info" role="note">
        <Icono nombre="escudo" tamano={18} />
        <span>
          Durante el piloto usa la <strong>imagen de cédula de prueba</strong> que te entregamos. No subas tu cédula
          real.
        </span>
      </p>

      <Campo
        id="rut"
        etiqueta="Tu RUT"
        autoComplete="off"
        spellCheck={false}
        placeholder="12.345.678-5"
        maxLength={14}
        value={rut}
        disabled={cargandoRut}
        onChange={(e) => {
          setRut(e.target.value)
          if (errorRut) setErrorRut(undefined)
        }}
        onBlur={() => {
          const { valor, error } = rutAlSalir(rut)
          const preparado = prepararRut(rut)
          const sigueRechazado = rechazoBase && preparado.ok && preparado.guardar === rechazoBase.rut
          setRut(valor)
          setErrorRut(error ?? (sigueRechazado ? rechazoBase.error : undefined))
        }}
        error={errorRut}
        ayuda={
          rutGuardado
            ? 'Ya lo guardamos. Puedes corregirlo si te equivocaste.'
            : 'Con puntos y guion, o todo junto. Lo comparamos con tu cédula y no aparece en tu perfil.'
        }
        required
      />

      <div className={`campo${errorArchivo ? ' campo-con-error' : ''}`}>
        <span className="campo-etiqueta" id="cedula-etiqueta">
          {renovacion
            ? 'Nueva foto o PDF de tu cédula (por delante)'
            : 'Foto o PDF de la cédula (por delante)'}
        </span>
        <label className={`zona-archivo${archivo && !errorArchivo ? ' zona-archivo-lista' : ''}`} htmlFor="cedula">
          <input
            id="cedula"
            name="cedula"
            type="file"
            className="solo-lector"
            accept={TIPOS_CEDULA.join(',')}
            onChange={elegir}
            aria-labelledby="cedula-etiqueta"
            aria-invalid={errorArchivo ? true : undefined}
            aria-describedby={['cedula-ayuda', errorArchivo && 'cedula-error'].filter(Boolean).join(' ')}
          />
          {vistaPrevia ? (
            <img src={vistaPrevia} alt="" className="zona-archivo-miniatura" />
          ) : (
            <span className="zona-archivo-icono" aria-hidden="true">
              <Icono nombre={archivo ? 'documento' : 'subir'} tamano={26} />
            </span>
          )}
          <span className="zona-archivo-texto">
            {archivo ? (
              <>
                <strong>{archivo.name}</strong>
                <span>{formatearTamano(archivo.size)} · Toca para cambiarla</span>
              </>
            ) : (
              <>
                <strong>Toca para elegir el archivo</strong>
                <span>Desde tu galería, la cámara o tus documentos</span>
              </>
            )}
          </span>
        </label>
        <p id="cedula-ayuda" className="campo-ayuda">
          JPG, PNG o PDF de hasta 5 MB. Que se lean el nombre y el número.
        </p>
        {errorArchivo && (
          <p id="cedula-error" className="campo-error">
            <Icono nombre="alerta" tamano={16} />
            {errorArchivo}
          </p>
        )}
      </div>

      <div className={`campo${errorAcepta ? ' campo-con-error' : ''}`}>
        <label className="opcion opcion-acepta">
          <input
            id="acepta"
            type="checkbox"
            checked={acepta}
            onChange={(e) => {
              setAcepta(e.target.checked)
              if (e.target.checked) setErrorAcepta(undefined)
            }}
            aria-invalid={errorAcepta ? true : undefined}
            aria-describedby={errorAcepta ? 'acepta-error' : undefined}
          />
          <span className="opcion-marca" aria-hidden="true" />
          <span>
            {renovacion
              ? 'Acepto que un administrador de MasterPlace revise mi nueva cédula solo para verificar mi identidad. Se elimina al aprobarla.'
              : 'Acepto que un administrador de MasterPlace revise mi cédula solo para verificar mi identidad. Se elimina al aprobarla.'}
          </span>
        </label>
        {errorAcepta && (
          <p id="acepta-error" className="campo-error">
            <Icono nombre="alerta" tamano={16} />
            {errorAcepta}
          </p>
        )}
      </div>

      {errorGeneral && (
        <p className="alerta-error" role="alert">
          <Icono nombre="alerta" tamano={18} />
          {errorGeneral}
        </p>
      )}

      <div className="acciones-paso">
        {alVolver && (
          <button type="button" className="boton boton-fantasma" onClick={alVolver} disabled={enviando}>
            Volver
          </button>
        )}
        <button type="submit" className="boton boton-primario" disabled={enviando} aria-busy={enviando}>
          {enviando && <span className="girador" aria-hidden="true" />}
          {enviando
            ? 'Enviando…'
            : renovacion
              ? 'Enviar nueva cédula'
              : 'Enviar a verificación'}
        </button>
      </div>
    </form>
  )
}
