begin;
update public.perfiles set rol = 'admin'
 where id = 'fec28c66-5a0f-5044-9acc-98a495234c5f';

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"fec28c66-5a0f-5044-9acc-98a495234c5f"}', true);
select public.es_admin();    -- esperado: true

