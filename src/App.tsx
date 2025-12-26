import React, { useEffect, useState } from 'react'
import { Route, Switch, Redirect, useLocation } from 'wouter'
import { Layout } from './components/Layout'
import { ToastProvider, useToast } from './components/Toast'
import { RequireSession } from './components/RequireSession'
import { useSession, getIsAdmin } from './lib/auth'

import DashboardPage from './pages/DashboardPage'
import CursosPage from './pages/CursosPage'
import CursoDetallePage from './pages/CursoDetallePage'
import MisCursosPage from './pages/MisCursosPage'
import DiplomasPage from './pages/DiplomasPage'
import VerificarDiplomaPage from './pages/VerificarDiplomaPage'
import AdminPage from './pages/AdminPage'
import CreditosPage from './pages/CreditosPage'
import NotFoundPage from './pages/NotFoundPage'

function Shell() {
  const [loc] = useLocation()
  const isPublic = loc.startsWith('/verificar-diploma')

  const { session, user, loading } = useSession()
  const { push } = useToast()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    if (!user) {
      setIsAdmin(false)
      return
    }
    setAdminLoading(true)
    getIsAdmin(user)
      .then((v) => {
        if (!mounted) return
        setIsAdmin(v)
      })
      .catch((e) => {
        console.warn(e)
        push({ kind: 'error', title: 'No se pudo validar el perfil', description: 'Revisa la tabla perfiles en Supabase.' })
      })
      .finally(() => setAdminLoading(false))
    return () => {
      mounted = false
    }
  }, [user, push])

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="bd">Cargando…</div>
        </div>
      </div>
    )
  }

  // Rutas públicas: verificación de diploma
  if (isPublic) {
    return (
      <Layout userEmail={user?.email ?? null} isAdmin={isAdmin} showSignOut={!!session}>
        <Switch>
          <Route path="/verificar-diploma/:codigo" component={VerificarDiplomaPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </Layout>
    )
  }

  // Rutas privadas: requieren sesión
  return (
    <Layout userEmail={user?.email ?? null} isAdmin={isAdmin} showSignOut={!!session}>
      <RequireSession hasSession={!!session}>
        {adminLoading ? <div className="small">Validando perfil…</div> : null}
        <Switch>
          <Route path="/" component={() => <Redirect to="/dashboard" />} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/cursos" component={CursosPage} />
          <Route path="/curso/:id" component={CursoDetallePage} />
          <Route path="/mis-cursos" component={MisCursosPage} />
          <Route
            path="/evaluacion/:id"
            component={() => (
              <div className="card">
                <div className="bd">Evaluación (MVP): se habilitará en la siguiente iteración.</div>
              </div>
            )}
          />
          <Route path="/diplomas" component={DiplomasPage} />
          <Route path="/creditos" component={() => <CreditosPage isAdmin={isAdmin} />} />
          <Route path="/admin" component={() => (isAdmin ? <AdminPage /> : <NotFoundPage />)} />
          <Route component={NotFoundPage} />
        </Switch>
      </RequireSession>
    </Layout>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  )
}
