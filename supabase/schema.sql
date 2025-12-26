-- Aula Virtual (SPA) - Esquema base
-- Ejecutar en Supabase SQL Editor

create extension if not exists pgcrypto;

-- 1) Perfiles (admin / usuario)
create table if not exists public.perfiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Trigger: crear perfil al crear usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles(user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Helper: ¿es admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.perfiles p where p.user_id = auth.uid()), false);
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.perfiles enable row level security;

-- Usuarios pueden ver su perfil; admin puede ver todos
drop policy if exists perfiles_select on public.perfiles;
create policy perfiles_select
on public.perfiles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Solo admin puede modificar perfiles (evita auto-escalar permisos)
drop policy if exists perfiles_update_admin on public.perfiles;
create policy perfiles_update_admin
on public.perfiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 2) Cursos / Lecciones
create table if not exists public.cursos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  horas int,
  creditos numeric,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lecciones (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.cursos(id) on delete cascade,
  titulo text not null,
  contenido text,
  orden int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.inscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  curso_id uuid not null references public.cursos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, curso_id)
);

create table if not exists public.progreso_lecciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  leccion_id uuid not null references public.lecciones(id) on delete cascade,
  completado boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(user_id, leccion_id)
);

-- Mantener updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists progreso_set_updated_at on public.progreso_lecciones;
create trigger progreso_set_updated_at
before update on public.progreso_lecciones
for each row execute function public.set_updated_at();

-- RLS cursos/lecciones/inscripciones/progreso
alter table public.cursos enable row level security;
alter table public.lecciones enable row level security;
alter table public.inscripciones enable row level security;
alter table public.progreso_lecciones enable row level security;

-- Cursos: select para authenticated; admin puede crear/editar
drop policy if exists cursos_select on public.cursos;
create policy cursos_select on public.cursos
for select to authenticated using (true);

drop policy if exists cursos_write_admin on public.cursos;
create policy cursos_write_admin on public.cursos
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Lecciones: select para authenticated; admin write
drop policy if exists lecciones_select on public.lecciones;
create policy lecciones_select on public.lecciones
for select to authenticated using (true);

drop policy if exists lecciones_write_admin on public.lecciones;
create policy lecciones_write_admin on public.lecciones
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Inscripciones: usuario o admin
drop policy if exists inscripciones_select on public.inscripciones;
create policy inscripciones_select on public.inscripciones
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists inscripciones_insert on public.inscripciones;
create policy inscripciones_insert on public.inscripciones
for insert to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists inscripciones_delete on public.inscripciones;
create policy inscripciones_delete on public.inscripciones
for delete to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Progreso: usuario o admin
drop policy if exists progreso_select on public.progreso_lecciones;
create policy progreso_select on public.progreso_lecciones
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists progreso_upsert on public.progreso_lecciones;
create policy progreso_upsert on public.progreso_lecciones
for insert to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists progreso_update on public.progreso_lecciones;
create policy progreso_update on public.progreso_lecciones
for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- 3) Diplomas
create table if not exists public.diplomas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  curso_id uuid not null references public.cursos(id) on delete cascade,
  codigo text not null unique,
  emitido_en timestamptz not null default now(),
  firma text,
  created_at timestamptz not null default now(),
  unique(user_id, curso_id)
);

alter table public.diplomas enable row level security;

drop policy if exists diplomas_select on public.diplomas;
create policy diplomas_select on public.diplomas
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists diplomas_insert on public.diplomas;
create policy diplomas_insert on public.diplomas
for insert to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists diplomas_update on public.diplomas;
create policy diplomas_update on public.diplomas
for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- Verificación pública por código (RPC)
create or replace function public.verificar_diploma(p_codigo text)
returns table(
  codigo text,
  emitido_en timestamptz,
  curso_titulo text,
  nombre text,
  colegiado_numero text,
  firma text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.codigo,
    d.emitido_en,
    c.titulo as curso_titulo,
    r.nombre,
    r.colegiado_numero,
    d.firma
  from public.diplomas d
  join public.cursos c on c.id = d.curso_id
  left join lateral (
    select rr.nombre, rr.colegiado_numero
    from public.registros rr
    where rr.usuario_id = d.user_id and rr.deleted_at is null
    order by rr.created_at desc
    limit 1
  ) r on true
  where d.codigo = p_codigo
  limit 1;
$$;

grant execute on function public.verificar_diploma(text) to anon, authenticated;

-- 4) Créditos
create table if not exists public.registros (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  correlativo int not null,
  nombre text not null,
  telefono text,
  colegiado_numero text not null,
  colegiado_activo boolean not null default true,
  actividad text not null,
  institucion text,
  tipo text not null,
  fecha date not null,
  horas numeric not null,
  creditos numeric not null,
  observaciones text,
  archivo_url text,
  archivo_mime text,
  hash text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(usuario_id, correlativo)
);

-- Correlativo por usuario (RPC)
create or replace function public.next_correlativo()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(max(r.correlativo), 0) + 1
  from public.registros r
  where r.usuario_id = auth.uid();
$$;

grant execute on function public.next_correlativo() to authenticated;

alter table public.registros enable row level security;

drop policy if exists registros_select on public.registros;
create policy registros_select on public.registros
for select to authenticated
using (usuario_id = auth.uid() or public.is_admin());

drop policy if exists registros_insert on public.registros;
create policy registros_insert on public.registros
for insert to authenticated
with check (usuario_id = auth.uid() or public.is_admin());

drop policy if exists registros_update on public.registros;
create policy registros_update on public.registros
for update to authenticated
using (usuario_id = auth.uid() or public.is_admin())
with check (usuario_id = auth.uid() or public.is_admin());

drop policy if exists registros_delete on public.registros;
create policy registros_delete on public.registros
for delete to authenticated
using (usuario_id = auth.uid() or public.is_admin());

-- 5) Storage policies (bucket "comprobantes")
-- Nota: crea el bucket en la UI primero.
-- Estas políticas se aplican sobre storage.objects.
-- Si tu proyecto ya tiene políticas, ajusta en consecuencia.

-- Enable RLS in storage.objects is on by default in Supabase.

drop policy if exists "comprobantes_read" on storage.objects;
create policy "comprobantes_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'comprobantes'
  and (owner = auth.uid() or public.is_admin())
);

drop policy if exists "comprobantes_insert" on storage.objects;
create policy "comprobantes_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'comprobantes'
  and owner = auth.uid()
);

drop policy if exists "comprobantes_delete" on storage.objects;
create policy "comprobantes_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'comprobantes'
  and (owner = auth.uid() or public.is_admin())
);
