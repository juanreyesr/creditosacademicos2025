import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

  const url = process.env.SUPABASE_URL
  const anon = process.env.SUPABASE_ANON_KEY
  const secret = process.env.DIPLOMA_HMAC_SECRET

  if (!url || !anon || !secret) {
    return res.status(500).send('Faltan variables SUPABASE_URL / SUPABASE_ANON_KEY / DIPLOMA_HMAC_SECRET')
  }

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).send('Missing bearer token')

  const { diploma_id } = req.body || {}
  if (!diploma_id) return res.status(400).send('diploma_id requerido')

  try {
    // 1) Validar token y obtener user_id
    const userResp = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
    })
    if (!userResp.ok) return res.status(401).send('Token inválido')
    const userJson = await userResp.json()
    const userId = userJson?.id
    if (!userId) return res.status(401).send('No user id')

    // 2) Leer diploma con el mismo token (respeta RLS)
    const sel = await fetch(`${url}/rest/v1/diplomas?id=eq.${encodeURIComponent(diploma_id)}&select=id,user_id,curso_id,codigo,emitido_en,firma`, {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    if (!sel.ok) {
      const t = await sel.text()
      return res.status(400).send(t || 'No se pudo leer diploma')
    }
    const arr = await sel.json()
    const row = arr?.[0]
    if (!row) return res.status(404).send('Diploma no encontrado')
    if (row.user_id !== userId) return res.status(403).send('No autorizado')

    const emitidoEn = row.emitido_en || new Date().toISOString()
    const payload = `${row.codigo}|${row.curso_id}|${row.user_id}|${emitidoEn}`
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('base64url')

    // 3) Persistir firma (si ya existe, no sobreescribir)
    const firmaFinal = row.firma || hmac
    const patchBody = { firma: firmaFinal, emitido_en: emitidoEn }

    const upd = await fetch(`${url}/rest/v1/diplomas?id=eq.${encodeURIComponent(diploma_id)}`, {
      method: 'PATCH',
      headers: {
        apikey: anon,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(patchBody),
    })
    if (!upd.ok) {
      const t = await upd.text()
      return res.status(400).send(t || 'No se pudo actualizar diploma')
    }

    return res.status(200).json({ firma: firmaFinal })
  } catch (e) {
    return res.status(500).send(e?.message || 'Error inesperado')
  }
}
