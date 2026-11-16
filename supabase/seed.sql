-- Datos ficticios para desarrollo y demostración (responsable: Ignacio).
-- Regla: solo datos inventados; documentos marcados «DOCUMENTO FICTICIO SIN VALIDEZ».

-- MasterPlace · Semilla de datos FICTICIOS (solo desarrollo / staging)
-- Se ejecuta con `supabase db reset` (supabase/seed.sql). NO aplicar en producción.
--
-- Piloto: gasfitería sanitaria, albañilería, carpintería, hojalatería y estructuras
-- metálicas, en Concepción, Talcahuano, Hualpén, San Pedro de la Paz, Chiguayante y Penco.
-- Contenido: 6 comunas, 5 oficios, 18 maestros y 20 clientes.
--   Maestros 01-15: 3 por oficio (3 con identidad pendiente, para probar estados).
--   Maestros 16-18: gásfiters verificados y disponibles en Talcahuano, Hualpén y Penco,
--   para que cada comuna del piloto tenga al menos un gásfiter (T3). Total: 15 verificados.
-- Cuentas: correos @masterplace.test (dominio reservado, no existe) y contraseña
-- de desarrollo común: Masterplace-dev-2026
-- RUT: ficticios con dígito verificador válido, en el rango 90.000.001+ (rango de
-- personas jurídicas), para no coincidir con personas reales.
-- Idempotente: se puede ejecutar más de una vez (on conflict do nothing).

-- 1. Comunas ------------------------------------------------------------------
-- Código = CUT (SUBDERE). Coordenadas = punto de referencia de la ciudad/comuna
-- según Wikipedia (infobox «Coordinates»), consultado el 10-nov-2026:
--   Concepción          en.wikipedia.org/wiki/Concepción,_Chile     (oficina del alcalde)
--   Talcahuano          en.wikipedia.org/wiki/Talcahuano
--   San Pedro de la Paz en.wikipedia.org/wiki/San_Pedro_de_la_Paz
--   Hualpén             en.wikipedia.org/wiki/Hualpén                (oficina del alcalde)
--   Chiguayante         en.wikipedia.org/wiki/Chiguayante            (redondeada a 3 decimales)
--   Penco               en.wikipedia.org/wiki/Penco
-- Son puntos de referencia, no centroides geométricos del polígono comunal.
-- ST_MakePoint recibe (longitud, latitud).
insert into public.comunas (id, nombre, region, centroide) values
  (8101, 'Concepción', 'Biobío', st_makepoint(-73.0513694, -36.8281944)::geography),
  (8103, 'Chiguayante', 'Biobío', st_makepoint(-73.017, -36.917)::geography),
  (8108, 'San Pedro de la Paz', 'Biobío', st_makepoint(-73.10306, -36.84194)::geography),
  (8110, 'Talcahuano', 'Biobío', st_makepoint(-73.12194, -36.71667)::geography),
  (8112, 'Hualpén', 'Biobío', st_makepoint(-73.08667, -36.78833)::geography),
  (8107, 'Penco', 'Biobío', st_makepoint(-72.99389, -36.73861)::geography)
on conflict (id) do nothing;

-- 2. Oficios -------------------------------------------------------------------
insert into public.oficios (nombre) values
  ('Gasfitería sanitaria'),
  ('Albañilería'),
  ('Carpintería'),
  ('Hojalatería'),
  ('Estructuras metálicas')
on conflict (nombre) do nothing;

-- 3. Cuentas de autenticación (auth.users + auth.identities) --------------------
-- Equivale a registrar usuarios con correo y contraseña. Los campos *_token van
-- como '' porque GoTrue falla al leer filas con NULL en esas columnas.
with datos (id, email, nombre) as (values
  ('fec28c66-5a0f-5044-9acc-98a495234c5f', 'maestro01@masterplace.test', 'Juan González Silva'),
  ('792b054a-4038-5069-a3e4-79b899409527', 'maestro02@masterplace.test', 'Luis Muñoz Martínez'),
  ('f137c6e2-fcc8-5da3-8bdb-92484fb11eb9', 'maestro03@masterplace.test', 'Carlos Rojas Sepúlveda'),
  ('c70f0b80-2924-539d-a56b-c22928bfbf0d', 'maestro04@masterplace.test', 'Pedro Díaz Morales'),
  ('c74eca34-3a1b-5f30-9ea7-f8747f88005b', 'maestro05@masterplace.test', 'Jorge Pérez Rodríguez'),
  ('932f82f0-ee9a-5930-b8cd-557a78003994', 'maestro06@masterplace.test', 'Miguel Soto López'),
  ('9935e19e-330e-5681-88cc-8984286e331f', 'maestro07@masterplace.test', 'Héctor Contreras Fuentes'),
  ('80a4f536-941a-5114-b519-ab1aea531f01', 'maestro08@masterplace.test', 'Sergio Silva Hernández'),
  ('bcf822d4-0b47-5a2c-9bba-f886ee7ddf6a', 'maestro09@masterplace.test', 'Raúl Martínez Torres'),
  ('8d639813-ea5d-5788-8692-09a762851ffe', 'maestro10@masterplace.test', 'Óscar Sepúlveda Araya'),
  ('bc41b5bc-6352-5e64-a31e-2e56be3305ab', 'maestro11@masterplace.test', 'Patricio Morales Flores'),
  ('ebf98ee5-ea00-5744-8808-83d7c2b5903e', 'maestro12@masterplace.test', 'Mario Rodríguez Espinoza'),
  ('61f5932a-0448-521c-ac46-b1aee170830f', 'maestro13@masterplace.test', 'Víctor López Valenzuela'),
  ('726cd497-a0d0-50d2-a8fd-57c51966f15c', 'maestro14@masterplace.test', 'Claudio Fuentes Castillo'),
  ('b7fb7f27-fdab-50c5-bca1-6996e2369980', 'maestro15@masterplace.test', 'Manuel Hernández Tapia'),
  ('9a1498a7-f0a4-5cfd-883b-5286a10ca2af', 'maestro16@masterplace.test', 'Rodrigo Parra Bustos'),
  ('11b40d8e-b788-5a1e-b9a3-e0d8d513e2f1', 'maestro17@masterplace.test', 'Cristián Navarro Ortiz'),
  ('c2052065-ea73-56d1-a29e-cd7b70441ad3', 'maestro18@masterplace.test', 'Felipe Maldonado Lagos'),
  ('62289cda-24fc-516c-bab8-7c7e698d6117', 'cliente01@masterplace.test', 'Juan Díaz Rodríguez'),
  ('3b73e358-7bd1-51f9-9970-20777e94e60b', 'cliente02@masterplace.test', 'Camila Pérez López'),
  ('d32a8324-0366-58fb-b32c-b95345f7423f', 'cliente03@masterplace.test', 'Francisca Soto Fuentes'),
  ('362c030c-58b5-52a5-b3d1-abf1452889c3', 'cliente04@masterplace.test', 'Pedro Contreras Hernández'),
  ('1b969207-a6b1-5571-af50-39cc7e2b3d97', 'cliente05@masterplace.test', 'Constanza Silva Torres'),
  ('54a00d3c-5ee4-57ab-90a4-5f93fbf369cd', 'cliente06@masterplace.test', 'Valentina Martínez Araya'),
  ('c5194ed9-ee87-53fc-86db-1b726d07d37b', 'cliente07@masterplace.test', 'Héctor Sepúlveda Flores'),
  ('c80897e1-7e28-58e5-a012-1fca713e4d52', 'cliente08@masterplace.test', 'Catalina Morales Espinoza'),
  ('eef890d5-7e19-55e4-b920-5f4cd6551c0c', 'cliente09@masterplace.test', 'Paula Rodríguez Valenzuela'),
  ('a49ca2ea-524e-5097-ac5d-b48ed5e81162', 'cliente10@masterplace.test', 'Óscar López Castillo'),
  ('4f35198d-0b49-5edf-9b94-ef868af9de63', 'cliente11@masterplace.test', 'Fernanda Fuentes Tapia'),
  ('c637ecf1-7653-502d-b40b-4e1d23ccb80f', 'cliente12@masterplace.test', 'Andrea Hernández Reyes'),
  ('d36b91cd-762a-5777-97d7-e74547ce2fe6', 'cliente13@masterplace.test', 'Víctor Torres Gutiérrez'),
  ('1ba0057d-8314-5455-bc92-694941fc152a', 'cliente14@masterplace.test', 'Sofía Araya Castro'),
  ('858028f7-16a8-5ba6-924e-f20bb0a6c0fa', 'cliente15@masterplace.test', 'Josefa Flores Pizarro'),
  ('ed70eb88-3070-5ed7-bdfb-f7bd0b422e04', 'cliente16@masterplace.test', 'Juan Espinoza Álvarez'),
  ('8f202ebc-259f-5374-b13d-eaabf120a0ff', 'cliente17@masterplace.test', 'Natalia Valenzuela Vásquez'),
  ('b2a9c0ed-ed90-5517-98d9-0912e2d2196c', 'cliente18@masterplace.test', 'Bárbara Castillo Sánchez'),
  ('9c7559c0-6856-53d7-ae6e-c456d5352034', 'cliente19@masterplace.test', 'Pedro Tapia Fernández'),
  ('40f05b9d-9964-5a86-9816-6b774d2ff021', 'cliente20@masterplace.test', 'Verónica Reyes Ramírez')
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select '00000000-0000-0000-0000-000000000000', d.id::uuid, 'authenticated', 'authenticated',
       d.email, extensions.crypt('Masterplace-dev-2026', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('nombre', d.nombre),
       now(), now(), '', '', '', ''
  from datos d
on conflict (id) do nothing;

with datos (id, email) as (values
  ('fec28c66-5a0f-5044-9acc-98a495234c5f', 'maestro01@masterplace.test'),
  ('792b054a-4038-5069-a3e4-79b899409527', 'maestro02@masterplace.test'),
  ('f137c6e2-fcc8-5da3-8bdb-92484fb11eb9', 'maestro03@masterplace.test'),
  ('c70f0b80-2924-539d-a56b-c22928bfbf0d', 'maestro04@masterplace.test'),
  ('c74eca34-3a1b-5f30-9ea7-f8747f88005b', 'maestro05@masterplace.test'),
  ('932f82f0-ee9a-5930-b8cd-557a78003994', 'maestro06@masterplace.test'),
  ('9935e19e-330e-5681-88cc-8984286e331f', 'maestro07@masterplace.test'),
  ('80a4f536-941a-5114-b519-ab1aea531f01', 'maestro08@masterplace.test'),
  ('bcf822d4-0b47-5a2c-9bba-f886ee7ddf6a', 'maestro09@masterplace.test'),
  ('8d639813-ea5d-5788-8692-09a762851ffe', 'maestro10@masterplace.test'),
  ('bc41b5bc-6352-5e64-a31e-2e56be3305ab', 'maestro11@masterplace.test'),
  ('ebf98ee5-ea00-5744-8808-83d7c2b5903e', 'maestro12@masterplace.test'),
  ('61f5932a-0448-521c-ac46-b1aee170830f', 'maestro13@masterplace.test'),
  ('726cd497-a0d0-50d2-a8fd-57c51966f15c', 'maestro14@masterplace.test'),
  ('b7fb7f27-fdab-50c5-bca1-6996e2369980', 'maestro15@masterplace.test'),
  ('9a1498a7-f0a4-5cfd-883b-5286a10ca2af', 'maestro16@masterplace.test'),
  ('11b40d8e-b788-5a1e-b9a3-e0d8d513e2f1', 'maestro17@masterplace.test'),
  ('c2052065-ea73-56d1-a29e-cd7b70441ad3', 'maestro18@masterplace.test'),
  ('62289cda-24fc-516c-bab8-7c7e698d6117', 'cliente01@masterplace.test'),
  ('3b73e358-7bd1-51f9-9970-20777e94e60b', 'cliente02@masterplace.test'),
  ('d32a8324-0366-58fb-b32c-b95345f7423f', 'cliente03@masterplace.test'),
  ('362c030c-58b5-52a5-b3d1-abf1452889c3', 'cliente04@masterplace.test'),
  ('1b969207-a6b1-5571-af50-39cc7e2b3d97', 'cliente05@masterplace.test'),
  ('54a00d3c-5ee4-57ab-90a4-5f93fbf369cd', 'cliente06@masterplace.test'),
  ('c5194ed9-ee87-53fc-86db-1b726d07d37b', 'cliente07@masterplace.test'),
  ('c80897e1-7e28-58e5-a012-1fca713e4d52', 'cliente08@masterplace.test'),
  ('eef890d5-7e19-55e4-b920-5f4cd6551c0c', 'cliente09@masterplace.test'),
  ('a49ca2ea-524e-5097-ac5d-b48ed5e81162', 'cliente10@masterplace.test'),
  ('4f35198d-0b49-5edf-9b94-ef868af9de63', 'cliente11@masterplace.test'),
  ('c637ecf1-7653-502d-b40b-4e1d23ccb80f', 'cliente12@masterplace.test'),
  ('d36b91cd-762a-5777-97d7-e74547ce2fe6', 'cliente13@masterplace.test'),
  ('1ba0057d-8314-5455-bc92-694941fc152a', 'cliente14@masterplace.test'),
  ('858028f7-16a8-5ba6-924e-f20bb0a6c0fa', 'cliente15@masterplace.test'),
  ('ed70eb88-3070-5ed7-bdfb-f7bd0b422e04', 'cliente16@masterplace.test'),
  ('8f202ebc-259f-5374-b13d-eaabf120a0ff', 'cliente17@masterplace.test'),
  ('b2a9c0ed-ed90-5517-98d9-0912e2d2196c', 'cliente18@masterplace.test'),
  ('9c7559c0-6856-53d7-ae6e-c456d5352034', 'cliente19@masterplace.test'),
  ('40f05b9d-9964-5a86-9816-6b774d2ff021', 'cliente20@masterplace.test')
)
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), d.id::uuid, d.id, 'email',
       jsonb_build_object('sub', d.id, 'email', d.email, 'email_verified', true),
       now(), now(), now()
  from datos d
 where not exists (select 1 from auth.identities i where i.user_id = d.id::uuid and i.provider = 'email');

-- 4. Perfiles --------------------------------------------------------------------
insert into public.perfiles (id, rol, nombre, telefono, comuna_id) values
  ('fec28c66-5a0f-5044-9acc-98a495234c5f', 'maestro', 'Juan González Silva', '+56 9 5550 0001', 8101),
  ('792b054a-4038-5069-a3e4-79b899409527', 'maestro', 'Luis Muñoz Martínez', '+56 9 5550 0002', 8103),
  ('f137c6e2-fcc8-5da3-8bdb-92484fb11eb9', 'maestro', 'Carlos Rojas Sepúlveda', '+56 9 5550 0003', 8108),
  ('c70f0b80-2924-539d-a56b-c22928bfbf0d', 'maestro', 'Pedro Díaz Morales', '+56 9 5550 0004', 8110),
  ('c74eca34-3a1b-5f30-9ea7-f8747f88005b', 'maestro', 'Jorge Pérez Rodríguez', '+56 9 5550 0005', 8112),
  ('932f82f0-ee9a-5930-b8cd-557a78003994', 'maestro', 'Miguel Soto López', '+56 9 5550 0006', 8107),
  ('9935e19e-330e-5681-88cc-8984286e331f', 'maestro', 'Héctor Contreras Fuentes', '+56 9 5550 0007', 8101),
  ('80a4f536-941a-5114-b519-ab1aea531f01', 'maestro', 'Sergio Silva Hernández', '+56 9 5550 0008', 8103),
  ('bcf822d4-0b47-5a2c-9bba-f886ee7ddf6a', 'maestro', 'Raúl Martínez Torres', '+56 9 5550 0009', 8108),
  ('8d639813-ea5d-5788-8692-09a762851ffe', 'maestro', 'Óscar Sepúlveda Araya', '+56 9 5550 0010', 8110),
  ('bc41b5bc-6352-5e64-a31e-2e56be3305ab', 'maestro', 'Patricio Morales Flores', '+56 9 5550 0011', 8112),
  ('ebf98ee5-ea00-5744-8808-83d7c2b5903e', 'maestro', 'Mario Rodríguez Espinoza', '+56 9 5550 0012', 8107),
  ('61f5932a-0448-521c-ac46-b1aee170830f', 'maestro', 'Víctor López Valenzuela', '+56 9 5550 0013', 8101),
  ('726cd497-a0d0-50d2-a8fd-57c51966f15c', 'maestro', 'Claudio Fuentes Castillo', '+56 9 5550 0014', 8103),
  ('b7fb7f27-fdab-50c5-bca1-6996e2369980', 'maestro', 'Manuel Hernández Tapia', '+56 9 5550 0015', 8108),
  ('9a1498a7-f0a4-5cfd-883b-5286a10ca2af', 'maestro', 'Rodrigo Parra Bustos', '+56 9 5550 0016', 8110),
  ('11b40d8e-b788-5a1e-b9a3-e0d8d513e2f1', 'maestro', 'Cristián Navarro Ortiz', '+56 9 5550 0017', 8112),
  ('c2052065-ea73-56d1-a29e-cd7b70441ad3', 'maestro', 'Felipe Maldonado Lagos', '+56 9 5550 0018', 8107),
  ('62289cda-24fc-516c-bab8-7c7e698d6117', 'cliente', 'Juan Díaz Rodríguez', '+56 9 5551 0001', 8103),
  ('3b73e358-7bd1-51f9-9970-20777e94e60b', 'cliente', 'Camila Pérez López', '+56 9 5551 0002', 8101),
  ('d32a8324-0366-58fb-b32c-b95345f7423f', 'cliente', 'Francisca Soto Fuentes', '+56 9 5551 0003', 8107),
  ('362c030c-58b5-52a5-b3d1-abf1452889c3', 'cliente', 'Pedro Contreras Hernández', '+56 9 5551 0004', 8112),
  ('1b969207-a6b1-5571-af50-39cc7e2b3d97', 'cliente', 'Constanza Silva Torres', '+56 9 5551 0005', 8110),
  ('54a00d3c-5ee4-57ab-90a4-5f93fbf369cd', 'cliente', 'Valentina Martínez Araya', '+56 9 5551 0006', 8108),
  ('c5194ed9-ee87-53fc-86db-1b726d07d37b', 'cliente', 'Héctor Sepúlveda Flores', '+56 9 5551 0007', 8103),
  ('c80897e1-7e28-58e5-a012-1fca713e4d52', 'cliente', 'Catalina Morales Espinoza', '+56 9 5551 0008', 8101),
  ('eef890d5-7e19-55e4-b920-5f4cd6551c0c', 'cliente', 'Paula Rodríguez Valenzuela', '+56 9 5551 0009', 8107),
  ('a49ca2ea-524e-5097-ac5d-b48ed5e81162', 'cliente', 'Óscar López Castillo', '+56 9 5551 0010', 8112),
  ('4f35198d-0b49-5edf-9b94-ef868af9de63', 'cliente', 'Fernanda Fuentes Tapia', '+56 9 5551 0011', 8110),
  ('c637ecf1-7653-502d-b40b-4e1d23ccb80f', 'cliente', 'Andrea Hernández Reyes', '+56 9 5551 0012', 8108),
  ('d36b91cd-762a-5777-97d7-e74547ce2fe6', 'cliente', 'Víctor Torres Gutiérrez', '+56 9 5551 0013', 8103),
  ('1ba0057d-8314-5455-bc92-694941fc152a', 'cliente', 'Sofía Araya Castro', '+56 9 5551 0014', 8101),
  ('858028f7-16a8-5ba6-924e-f20bb0a6c0fa', 'cliente', 'Josefa Flores Pizarro', '+56 9 5551 0015', 8107),
  ('ed70eb88-3070-5ed7-bdfb-f7bd0b422e04', 'cliente', 'Juan Espinoza Álvarez', '+56 9 5551 0016', 8112),
  ('8f202ebc-259f-5374-b13d-eaabf120a0ff', 'cliente', 'Natalia Valenzuela Vásquez', '+56 9 5551 0017', 8110),
  ('b2a9c0ed-ed90-5517-98d9-0912e2d2196c', 'cliente', 'Bárbara Castillo Sánchez', '+56 9 5551 0018', 8108),
  ('9c7559c0-6856-53d7-ae6e-c456d5352034', 'cliente', 'Pedro Tapia Fernández', '+56 9 5551 0019', 8103),
  ('40f05b9d-9964-5a86-9816-6b774d2ff021', 'cliente', 'Verónica Reyes Ramírez', '+56 9 5551 0020', 8101)
on conflict (id) do nothing;

-- 5. Maestros (01-15: 3 por oficio; 16-18: gásfiters de Talcahuano, Hualpén y Penco). Punto de referencia = centroide de su comuna con
--    un desplazamiento fijo de ±0,8 km aprox., para que ST_Distance sea variado.
insert into public.maestros
  (id, oficio_id, descripcion, anios_experiencia, referencia, disponible, estado_identidad, nivel_reputacion, certificado_ok) values
  ('fec28c66-5a0f-5044-9acc-98a495234c5f', 1, 'Instalación y reparación de redes de agua potable y alcantarillado, artefactos sanitarios y calefont. Detección de fugas.', 5, st_makepoint(-73.058554, -36.823520)::geography, true, 'verificada', false, false),
  ('792b054a-4038-5069-a3e4-79b899409527', 1, 'Instalación y reparación de redes de agua potable y alcantarillado, artefactos sanitarios y calefont. Detección de fugas.', 8, st_makepoint(-73.012890, -36.922427)::geography, true, 'verificada', false, false),
  ('f137c6e2-fcc8-5da3-8bdb-92484fb11eb9', 1, 'Instalación y reparación de redes de agua potable y alcantarillado, artefactos sanitarios y calefont. Detección de fugas.', 11, st_makepoint(-73.107546, -36.848622)::geography, true, 'verificada', false, false),
  ('c70f0b80-2924-539d-a56b-c22928bfbf0d', 2, 'Ampliaciones, radieres, estucos y reparación de muros.', 14, st_makepoint(-73.120528, -36.722474)::geography, true, 'verificada', false, true),
  ('c74eca34-3a1b-5f30-9ea7-f8747f88005b', 2, 'Ampliaciones, radieres, estucos y reparación de muros.', 17, st_makepoint(-73.079486, -36.784973)::geography, true, 'pendiente', false, false),
  ('932f82f0-ee9a-5930-b8cd-557a78003994', 2, 'Ampliaciones, radieres, estucos y reparación de muros.', 20, st_makepoint(-72.997812, -36.732367)::geography, true, 'verificada', false, false),
  ('9935e19e-330e-5681-88cc-8984286e331f', 3, 'Muebles a medida, puertas, closets y reparaciones en madera.', 23, st_makepoint(-73.050585, -36.836132)::geography, false, 'verificada', false, false),
  ('80a4f536-941a-5114-b519-ab1aea531f01', 3, 'Muebles a medida, puertas, closets y reparaciones en madera.', 2, st_makepoint(-73.021612, -36.919416)::geography, true, 'verificada', false, true),
  ('bcf822d4-0b47-5a2c-9bba-f886ee7ddf6a', 3, 'Muebles a medida, puertas, closets y reparaciones en madera.', 5, st_makepoint(-73.100080, -36.838709)::geography, true, 'verificada', false, false),
  ('8d639813-ea5d-5788-8692-09a762851ffe', 4, 'Canaletas, bajadas de agua, forros, ductos y trabajos en plancha de zinc y acero.', 8, st_makepoint(-73.126050, -36.723478)::geography, true, 'pendiente', false, false),
  ('bc41b5bc-6352-5e64-a31e-2e56be3305ab', 4, 'Canaletas, bajadas de agua, forros, ductos y trabajos en plancha de zinc y acero.', 11, st_makepoint(-73.086325, -36.784597)::geography, true, 'verificada', false, false),
  ('ebf98ee5-ea00-5744-8808-83d7c2b5903e', 4, 'Canaletas, bajadas de agua, forros, ductos y trabajos en plancha de zinc y acero.', 14, st_makepoint(-72.999443, -36.736069)::geography, true, 'verificada', false, true),
  ('61f5932a-0448-521c-ac46-b1aee170830f', 5, 'Soldadura y fabricación de rejas, portones, escaleras y estructuras de acero.', 17, st_makepoint(-73.044122, -36.821198)::geography, true, 'verificada', false, false),
  ('726cd497-a0d0-50d2-a8fd-57c51966f15c', 5, 'Soldadura y fabricación de rejas, portones, escaleras y estructuras de acero.', 20, st_makepoint(-73.021173, -36.914208)::geography, false, 'verificada', false, false),
  ('b7fb7f27-fdab-50c5-bca1-6996e2369980', 5, 'Soldadura y fabricación de rejas, portones, escaleras y estructuras de acero.', 23, st_makepoint(-73.110997, -36.835697)::geography, true, 'pendiente', false, false),
  ('9a1498a7-f0a4-5cfd-883b-5286a10ca2af', 1, 'Instalación y reparación de redes de agua potable y alcantarillado, artefactos sanitarios y calefont. Detección de fugas.', 9, st_makepoint(-73.119336, -36.710678)::geography, true, 'verificada', false, true),
  ('11b40d8e-b788-5a1e-b9a3-e0d8d513e2f1', 1, 'Instalación y reparación de redes de agua potable y alcantarillado, artefactos sanitarios y calefont. Detección de fugas.', 13, st_makepoint(-73.083627, -36.790306)::geography, true, 'verificada', false, false),
  ('c2052065-ea73-56d1-a29e-cd7b70441ad3', 1, 'Instalación y reparación de redes de agua potable y alcantarillado, artefactos sanitarios y calefont. Detección de fugas.', 6, st_makepoint(-72.987019, -36.742218)::geography, true, 'verificada', false, false)
on conflict (id) do nothing;

-- 6. Datos privados (RUT ficticio)
insert into public.maestros_privado (id, rut) values
  ('fec28c66-5a0f-5044-9acc-98a495234c5f', '90000001-4'),
  ('792b054a-4038-5069-a3e4-79b899409527', '90000002-2'),
  ('f137c6e2-fcc8-5da3-8bdb-92484fb11eb9', '90000003-0'),
  ('c70f0b80-2924-539d-a56b-c22928bfbf0d', '90000004-9'),
  ('c74eca34-3a1b-5f30-9ea7-f8747f88005b', '90000005-7'),
  ('932f82f0-ee9a-5930-b8cd-557a78003994', '90000006-5'),
  ('9935e19e-330e-5681-88cc-8984286e331f', '90000007-3'),
  ('80a4f536-941a-5114-b519-ab1aea531f01', '90000008-1'),
  ('bcf822d4-0b47-5a2c-9bba-f886ee7ddf6a', '90000009-K'),
  ('8d639813-ea5d-5788-8692-09a762851ffe', '90000010-3'),
  ('bc41b5bc-6352-5e64-a31e-2e56be3305ab', '90000011-1'),
  ('ebf98ee5-ea00-5744-8808-83d7c2b5903e', '90000012-K'),
  ('61f5932a-0448-521c-ac46-b1aee170830f', '90000013-8'),
  ('726cd497-a0d0-50d2-a8fd-57c51966f15c', '90000014-6'),
  ('b7fb7f27-fdab-50c5-bca1-6996e2369980', '90000015-4'),
  ('9a1498a7-f0a4-5cfd-883b-5286a10ca2af', '90000016-2'),
  ('11b40d8e-b788-5a1e-b9a3-e0d8d513e2f1', '90000017-0'),
  ('c2052065-ea73-56d1-a29e-cd7b70441ad3', '90000018-9')
on conflict (id) do nothing;

-- 7. Cobertura: su comuna + una vecina
insert into public.coberturas (maestro_id, comuna_id) values
  ('fec28c66-5a0f-5044-9acc-98a495234c5f', 8101),
  ('fec28c66-5a0f-5044-9acc-98a495234c5f', 8103),
  ('792b054a-4038-5069-a3e4-79b899409527', 8103),
  ('792b054a-4038-5069-a3e4-79b899409527', 8101),
  ('f137c6e2-fcc8-5da3-8bdb-92484fb11eb9', 8108),
  ('f137c6e2-fcc8-5da3-8bdb-92484fb11eb9', 8101),
  ('c70f0b80-2924-539d-a56b-c22928bfbf0d', 8110),
  ('c70f0b80-2924-539d-a56b-c22928bfbf0d', 8112),
  ('c74eca34-3a1b-5f30-9ea7-f8747f88005b', 8112),
  ('c74eca34-3a1b-5f30-9ea7-f8747f88005b', 8101),
  ('932f82f0-ee9a-5930-b8cd-557a78003994', 8107),
  ('932f82f0-ee9a-5930-b8cd-557a78003994', 8110),
  ('9935e19e-330e-5681-88cc-8984286e331f', 8101),
  ('9935e19e-330e-5681-88cc-8984286e331f', 8103),
  ('80a4f536-941a-5114-b519-ab1aea531f01', 8103),
  ('80a4f536-941a-5114-b519-ab1aea531f01', 8101),
  ('bcf822d4-0b47-5a2c-9bba-f886ee7ddf6a', 8108),
  ('bcf822d4-0b47-5a2c-9bba-f886ee7ddf6a', 8101),
  ('8d639813-ea5d-5788-8692-09a762851ffe', 8110),
  ('8d639813-ea5d-5788-8692-09a762851ffe', 8112),
  ('bc41b5bc-6352-5e64-a31e-2e56be3305ab', 8112),
  ('bc41b5bc-6352-5e64-a31e-2e56be3305ab', 8101),
  ('ebf98ee5-ea00-5744-8808-83d7c2b5903e', 8107),
  ('ebf98ee5-ea00-5744-8808-83d7c2b5903e', 8110),
  ('61f5932a-0448-521c-ac46-b1aee170830f', 8101),
  ('61f5932a-0448-521c-ac46-b1aee170830f', 8103),
  ('726cd497-a0d0-50d2-a8fd-57c51966f15c', 8103),
  ('726cd497-a0d0-50d2-a8fd-57c51966f15c', 8101),
  ('b7fb7f27-fdab-50c5-bca1-6996e2369980', 8108),
  ('b7fb7f27-fdab-50c5-bca1-6996e2369980', 8101),
  ('9a1498a7-f0a4-5cfd-883b-5286a10ca2af', 8110),
  ('9a1498a7-f0a4-5cfd-883b-5286a10ca2af', 8112),
  ('11b40d8e-b788-5a1e-b9a3-e0d8d513e2f1', 8112),
  ('11b40d8e-b788-5a1e-b9a3-e0d8d513e2f1', 8110),
  ('c2052065-ea73-56d1-a29e-cd7b70441ad3', 8107),
  ('c2052065-ea73-56d1-a29e-cd7b70441ad3', 8110)
on conflict do nothing;

-- Hecho (Ignacio, martes 10-11): 6 comunas con código y centroide (fuente citada arriba),
-- 5 oficios, 18 maestros (15 verificados, 3 pendientes) y 20 clientes de prueba.