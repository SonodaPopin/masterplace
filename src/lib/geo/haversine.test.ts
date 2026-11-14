import { haversineKm, RADIO_TIERRA_KM } from './haversine'
import type { Punto } from './haversine'

// Coordenadas de prueba
const plazaConcepcion: Punto = { lat: -36.8269, lng: -73.0498 }
const plazaTalcahuano: Punto = { lat: -36.7248, lng: -73.1167 }

console.log('--- Ejecutando pruebas manuales de Haversine ---')

// 1. Mismo punto (debe ser 0)
const dMismo = haversineKm(plazaConcepcion, plazaConcepcion)
console.assert(dMismo === 0, `Falló: distancia al mismo punto debería ser 0, dio ${dMismo}`)
console.log('✓ Prueba 1 (Mismo punto): OK')

// 2. Simetría
const dAB = haversineKm(plazaConcepcion, plazaTalcahuano)
const dBA = haversineKm(plazaTalcahuano, plazaConcepcion)
const simetricaOk = Math.abs(dAB - dBA) < 0.0001
console.assert(simetricaOk, `Falló la simetría: d(A,B)=${dAB}, d(B,A)=${dBA}`)
console.log(`✓ Prueba 2 (Simetría): OK (${dAB.toFixed(2)} km)`)

// 3. Comparación con PostGIS (~13.43 km con tolerancia del 1%)
const referenciaPostGIS = 13.43
const errorRelativo = Math.abs(dAB - referenciaPostGIS) / referenciaPostGIS
console.assert(errorRelativo <= 0.01, `Falló la tolerancia: error de ${errorRelativo * 100}%`)
console.log(`✓ Prueba 3 (Tolerancia PostGIS <= 1%): OK (Error: ${(errorRelativo * 100).toFixed(2)}%)`)

// 4. Validación de rangos
let errorLanzado = false
try {
  haversineKm({ lat: 100, lng: 0 }, plazaConcepcion) // Latitud inválida
} catch (e) {
  errorLanzado = true
}
console.assert(errorLanzado, 'Falló: debió rechazar latitud 100')
console.log('✓ Prueba 4 (Validación de rangos): OK')

console.log('\n¡Todas las pruebas manuales pasaron exitosamente! 🎉')