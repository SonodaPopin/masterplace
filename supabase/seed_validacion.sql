-- MasterPlace · Maestros FICTICIOS para la validación con usuarios (docs/validacion/plan_validacion.md §3)
--
-- Completa hasta 3 maestros verificados y disponibles por cada oficio y comuna del piloto, para que la búsqueda
-- de los participantes (tarea T3) tenga resultados en cualquier combinación.
--
-- Cómo funciona: para cada oficio busca la comuna a la que más maestros le faltan, crea uno con su punto de
-- referencia en esa comuna y le da cobertura ahí y en la comuna más cercana a la que también le falten. Repite
-- hasta que no falte ninguno. Así se crean menos cuentas que con un maestro por cada hueco.
--
-- Solo datos inventados:
--   * correos validacionNN@masterplace.test (dominio reservado, no existe) y la contraseña de desarrollo de seed.sql;
--   * RUT ficticios desde 91.000.001 (rango de personas jurídicas), con dígito verificador válido;
--   * teléfonos +56 9 5552 NNNN.
--
-- Idempotente: calcula lo que falta cada vez. Si ya no falta nada, no crea nada.
-- PRUEBA: con v_probar = true termina con una excepción que deshace TODO y muestra el resumen en el error.
-- Para crearlos de verdad, cambiar v_probar a false.
-- Para borrarlos después de la validación, ver el final del archivo.

do $$
declare
  v_probar    constant boolean := true;
  v_minimo    constant int := 3;
  v_nombres   constant text[] := array[
    'Rodrigo','Cristián','Alejandro','Francisco','Gonzalo','Ricardo','Felipe','Mauricio','Eduardo','Marcelo',
    'Daniel','Andrés','Fernando','Jaime','Hernán','Roberto','Nelson','Germán','Iván','Tomás',
    'Carolina','Marcela','Paola','Daniela','Lorena','Claudia','Gabriela','Pamela','Ximena','Javiera'];
  v_apellidos constant text[] := array[
    'Vergara','Cáceres','Riquelme','Navarro','Jara','Bustos','Saavedra','Carrasco','Salazar','Peña',
    'Orellana','Figueroa','Vega','Molina','Campos','Cortés','Garrido','Herrera','Leiva','Núñez',
    'Parra','Quezada','Ramos','Toledo','Ulloa','Venegas','Yáñez','Zúñiga','Alarcón','Bravo'];
  r_oficio  record;
  v_home    record;
  v_vecina  smallint;
  v_i       int;
  v_id      uuid;
  v_email   text;
  v_nombre  text;
  v_desc    text;
  v_rut     int;
  v_n       int;
  v_suma    int;
  v_factor  int;
  v_dv      text;
  v_creados int := 0;
  v_resumen text;
begin
  v_i := (select count(*) from auth.users where email like 'validacion%@masterplace.test');

  for r_oficio in select o.id, o.nombre from public.oficios o order by o.id loop
    v_desc := case r_oficio.nombre
      when 'Gasfitería sanitaria'  then 'Instalación y reparación de redes de agua potable y alcantarillado, artefactos sanitarios y calefont. Detección de fugas.'
      when 'Albañilería'           then 'Ampliaciones, radieres, estucos y reparación de muros.'
      when 'Carpintería'           then 'Muebles a medida, puertas, closets y reparaciones en madera.'
      when 'Hojalatería'           then 'Canaletas, bajadas de agua, forros, ductos y trabajos en plancha de zinc y acero.'
      when 'Estructuras metálicas' then 'Soldadura y fabricación de rejas, portones, escaleras y estructuras de acero.'
      else 'Trabajos de ' || lower(r_oficio.nombre) || '.'
    end;

    loop
      -- Comuna a la que más maestros verificados y disponibles le faltan para este oficio.
      select c.id, c.centroide, v_minimo - coalesce(k.n, 0) as falta
        into v_home
        from public.comunas c
        left join (
          select cb.comuna_id, count(distinct m.id) as n
            from public.coberturas cb
            join public.maestros m on m.id = cb.maestro_id
           where m.oficio_id = r_oficio.id and m.estado_identidad = 'verificada' and m.disponible
           group by cb.comuna_id
        ) k on k.comuna_id = c.id
       order by falta desc, c.id
       limit 1;

      exit when v_home.falta <= 0;

      -- Segunda comuna de cobertura: la más cercana a la que también le falten.
      select c.id
        into v_vecina
        from public.comunas c
       where c.id <> v_home.id
         and v_minimo > (
           select count(distinct m.id)
             from public.coberturas cb
             join public.maestros m on m.id = cb.maestro_id
            where cb.comuna_id = c.id and m.oficio_id = r_oficio.id
              and m.estado_identidad = 'verificada' and m.disponible)
       order by st_distance(c.centroide, v_home.centroide)
       limit 1;

      -- Datos de la cuenta (correo único aunque se hayan borrado algunas antes).
      loop
        v_i := v_i + 1;
        v_email := 'validacion' || lpad(v_i::text, 2, '0') || '@masterplace.test';
        exit when not exists (select 1 from auth.users where email = v_email);
      end loop;
      v_id := gen_random_uuid();
      v_nombre := v_nombres[1 + (v_i * 7) % 30] || ' ' || v_apellidos[1 + (v_i * 11) % 30] || ' '
                  || v_apellidos[1 + (v_i * 13 + 5) % 30];

      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change, email_change_token_new
      ) values (
        '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
        v_email, extensions.crypt('Masterplace-dev-2026', extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('nombre', v_nombre, 'rol', 'maestro', 'comuna_id', v_home.id,
                           'telefono', '+56 9 5552 ' || lpad(v_i::text, 4, '0')),
        now(), now(), '', '', '', ''
      );

      insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), v_id, v_id::text, 'email',
              jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
              now(), now(), now());

      -- El trigger de registro ya crea el perfil desde los metadatos; esto lo asegura igual.
      insert into public.perfiles (id, rol, nombre, telefono, comuna_id)
      values (v_id, 'maestro', v_nombre, '+56 9 5552 ' || lpad(v_i::text, 4, '0'), v_home.id)
      on conflict (id) do update
        set rol = 'maestro', nombre = excluded.nombre, telefono = excluded.telefono, comuna_id = excluded.comuna_id;

      -- Punto de referencia: el de la comuna con un desplazamiento fijo de hasta ±0,9 km aprox.
      insert into public.maestros
        (id, oficio_id, descripcion, anios_experiencia, referencia, disponible, estado_identidad, nivel_reputacion, certificado_ok)
      values (
        v_id, r_oficio.id, v_desc, 2 + (v_i * 7) % 28,
        st_makepoint(st_x(v_home.centroide::geometry) + ((v_i % 5) - 2) * 0.004,
                     st_y(v_home.centroide::geometry) + (((v_i * 3) % 5) - 2) * 0.004)::geography,
        true, 'verificada', false, (v_i % 4 = 0)
      );

      -- RUT ficticio con dígito verificador (módulo 11).
      v_rut := 91000000 + v_i;
      v_n := v_rut; v_suma := 0; v_factor := 2;
      while v_n > 0 loop
        v_suma := v_suma + (v_n % 10) * v_factor;
        v_n := v_n / 10;
        v_factor := case when v_factor = 7 then 2 else v_factor + 1 end;
      end loop;
      v_dv := case 11 - (v_suma % 11) when 11 then '0' when 10 then 'K' else (11 - (v_suma % 11))::text end;
      insert into public.maestros_privado (id, rut) values (v_id, v_rut::text || '-' || v_dv);

      insert into public.coberturas (maestro_id, comuna_id) values (v_id, v_home.id);
      if v_vecina is not null then
        insert into public.coberturas (maestro_id, comuna_id) values (v_id, v_vecina);
      end if;

      v_creados := v_creados + 1;
    end loop;
  end loop;

  -- Resumen: maestros verificados y disponibles por oficio y comuna.
  select string_agg(o.nombre || ': ' || (
           select string_agg(c.nombre || '=' || (
               select count(distinct m.id)
                 from public.coberturas cb join public.maestros m on m.id = cb.maestro_id
                where m.oficio_id = o.id and cb.comuna_id = c.id
                  and m.estado_identidad = 'verificada' and m.disponible), ', ' order by c.nombre)
             from public.comunas c), ' | ' order by o.nombre)
    into v_resumen
    from public.oficios o;

  if v_probar then
    raise exception 'PRUEBA, no se guardó nada. Se crearían % maestros. Quedaría así: %', v_creados, v_resumen;
  end if;
end;
$$;

-- Comprobación (solo se llega aquí con v_probar = false): cuántos se crearon y el mínimo por oficio y comuna.
select (select count(*) from auth.users where email like 'validacion%@masterplace.test') as maestros_validacion,
       (select min(n) from (
          select o.id, c.id, count(distinct m.id) as n
            from public.oficios o cross join public.comunas c
            left join public.coberturas cb on cb.comuna_id = c.id
            left join public.maestros m on m.id = cb.maestro_id and m.oficio_id = o.id
                 and m.estado_identidad = 'verificada' and m.disponible
           group by o.id, c.id) t) as minimo_por_oficio_y_comuna;

-- Borrar estos maestros DESPUÉS de la verificación de Hugo (borra en cascada perfil, maestro, cobertura, RUT y
-- también los contactos y mensajes que los participantes tuvieron con ellos):
-- delete from auth.users where email like 'validacion%@masterplace.test';
