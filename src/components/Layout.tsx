import React from 'react'
import { Link, useLocation } from 'wouter'
import { signOutSafely } from '../lib/auth'

function NavLink({ href, label }: { href: string; label: string }) {
  const [loc] = useLocation()
  const active = loc === href || (href !== '/' && loc.startsWith(href))
  return (
    <Link href={href} className={'pill' + (active ? ' active' : '')}>
      {label}
    </Link>
  )
}

export function Layout({
  children,
  userEmail,
  isAdmin,
  showSignOut,
}: {
  children: React.ReactNode
  userEmail?: string | null
  isAdmin?: boolean
  showSignOut?: boolean
}) {
  return (
    <div className="container">
      <header className="nav">
        <div className="brand">
          <img src="/logo-cpg.png" alt="Logo" />
          <div>
            <div>Aula Virtual</div>
            <div className="small">CAEDUC — Colegio de Psicólogos</div>
          </div>
        </div>

        <nav className="navlinks">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/cursos" label="Cursos" />
          <NavLink href="/mis-cursos" label="Mis cursos" />
          <NavLink href="/diplomas" label="Diplomas" />
          <NavLink href="/creditos" label="Créditos" />
          {isAdmin ? <NavLink href="/admin" label="Admin" /> : null}
        </nav>

        <div className="right">
          {isAdmin ? <div className="badge">Perfil: Admin</div> : <div className="badge">Perfil: Usuario</div>}
          <div className="badge">{userEmail ?? 'Sin sesión'}</div>
          {showSignOut ? (
            <button className="btn" onClick={signOutSafely} title="Cerrar sesión de Supabase">
              Cerrar sesión
            </button>
          ) : null}
        </div>
      </header>

      <main style={{ marginTop: 16 }}>{children}</main>
    </div>
  )
}
