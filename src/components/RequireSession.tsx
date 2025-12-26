import React from 'react'

export function RequireSession({
  hasSession,
  children,
}: {
  hasSession: boolean
  children: React.ReactNode
}) {
  if (!hasSession) {
    return (
      <div className="card">
        <div className="hd">
          <div>
            <h1 className="h1">Sesión requerida</h1>
            <p className="p">
              Esta aplicación está diseñada para integrarse a otra plataforma que gestiona el acceso.
              Inicia sesión en la plataforma anfitriona y vuelve a abrir esta aula virtual.
            </p>
          </div>
        </div>
        <div className="bd">
          <div className="small">
            Si estás probando en Vercel de forma directa, necesitas que exista una sesión activa de Supabase en el navegador.
          </div>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
