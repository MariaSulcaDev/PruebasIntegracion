import { useState, useEffect } from 'react'

const API = 'http://localhost:8080/api/personas'
const initialForm = { nombre: '', apellido: '', email: '', telefono: '', fechaNacimiento: '' }

function formatFecha(fecha) {
  if (!fecha) return '—'
  const parts = fecha.split('-')
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
  return fecha
}

function App() {
  const [personas, setPersonas] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editId, setEditId] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const cargar = () => {
    fetch(API).then(r => r.json()).then(setPersonas)
  }

  useEffect(() => { cargar() }, [])

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje(null), 3000)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await fetch(`${API}/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      mostrarMensaje('Persona actualizada correctamente', 'exito')
    } else {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      mostrarMensaje('Persona registrada correctamente', 'exito')
    }
    setForm(initialForm)
    setEditId(null)
    cargar()
  }

  const editar = (p) => {
    setForm({
      nombre: p.nombre,
      apellido: p.apellido,
      email: p.email,
      telefono: p.telefono || '',
      fechaNacimiento: p.fechaNacimiento || ''
    })
    setEditId(p.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta persona?')) return
    await fetch(`${API}/${id}`, { method: 'DELETE' })
    mostrarMensaje('Persona eliminada correctamente', 'exito')
    cargar()
  }

  const cancelar = () => {
    setForm(initialForm)
    setEditId(null)
  }

  const filtradas = personas.filter(p =>
    `${p.nombre} ${p.apellido} ${p.email}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Gestión de Personas</h1>
                <p className="text-xs text-slate-500">Sistema de administración</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Conectado
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                {personas.length} registros
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mensaje && (
          <div id="mensaje" className={`mb-6 flex items-center gap-3 px-5 py-4 rounded-xl border text-sm font-medium shadow-sm animate-[fadeIn_0.3s_ease] ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <span className="text-lg">{mensaje.tipo === 'exito' ? '✓' : '✕'}</span>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/50 border border-slate-200/60 overflow-hidden sticky top-24">
              <div className={`px-6 py-4 border-b border-slate-100 ${editId ? 'bg-amber-50' : 'bg-slate-50'}`}>
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  {editId ? (
                    <><svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Editar Persona</>
                  ) : (
                    <><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> Nueva Persona</>
                  )}
                </h2>
              </div>

              <form id="personaForm" onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="nombre" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Nombre</label>
                  <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Ej: Maria Aurora"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50" />
                </div>
                <div>
                  <label htmlFor="apellido" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Apellido</label>
                  <input id="apellido" name="apellido" value={form.apellido} onChange={handleChange} required placeholder="Ej: Sulca Barrera"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Email</label>
                  <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="correo@vallegrande.edu.pe"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="telefono" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Teléfono</label>
                    <input id="telefono" name="telefono" value={form.telefono} onChange={handleChange} placeholder="987654321"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50" />
                  </div>
                  <div>
                    <label htmlFor="fechaNacimiento" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">F. Nacimiento</label>
                    <input id="fechaNacimiento" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" id="btnGuardar"
                    className={`flex-1 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm cursor-pointer ${
                      editId
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
                    }`}>
                    {editId ? 'Actualizar' : 'Guardar'}
                  </button>
                  {editId && (
                    <button type="button" id="btnCancelar" onClick={cancelar}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer">
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Listado de Personas
                </h2>
                <div className="relative">
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table id="tablaPersonas" className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Nombre</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Apellido</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Teléfono</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">F. Nac.</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtradas.map((p, i) => (
                      <tr key={p.id} className={`hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{p.id}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{p.nombre}</td>
                        <td className="px-4 py-3 text-slate-600">{p.apellido}</td>
                        <td className="px-4 py-3">
                          <span className="text-blue-600 text-xs">{p.email}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{p.telefono || '—'}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{formatFecha(p.fechaNacimiento)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button className="btn-editar inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all cursor-pointer" onClick={() => editar(p)}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              Editar
                            </button>
                            <button className="btn-eliminar inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all cursor-pointer" onClick={() => eliminar(p.id)}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filtradas.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm">No se encontraron personas</p>
                </div>
              )}

              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex justify-between">
                <span>Mostrando {filtradas.length} de {personas.length} registros</span>
                <span>Spring Boot WebFlux + R2DBC + H2</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
