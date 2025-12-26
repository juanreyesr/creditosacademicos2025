import React from 'react'
import { Link } from 'wouter'

export default function NotFoundPage() {
  return (
    <div className="card">
      <div className="hd">
        <div>
          <h1 className="h1">Página no encontrada</h1>
          <p className="p">La ruta solicitada no existe en esta versión.</p>
        </div>
      </div>
      <div className="bd">
        <Link href="/dashboard" className="btn primary">Ir al dashboard</Link>
      </div>
    </div>
  )
}
