import { useState } from 'react'

export default function HowToModal() {
  const [open, setOpen] = useState(false)

  if (!open) return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={() => setOpen(true)}
      style={{ fontSize: 13, color: 'var(--gray-500)' }}
    >
      Como usar esta pagina
    </button>
  )

  return (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>Como usar esta pagina</div>
          <button onClick={() => setOpen(false)} style={{ fontSize: 20, color: 'var(--gray-400)', padding: 4 }}>x</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Busca una figurita</div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.5 }}>
              Usa el buscador para encontrar el pais o numero que te falta. Filtra por ciudad o modalidad (intercambio o venta).
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Contacta a quien la tiene</div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.5 }}>
              Haz clic en <strong>WhatsApp</strong> para escribirle directamente. Coordina en un lugar publico y seguro.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Publica tus repetidas</div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.5 }}>
              Haz clic en <strong>Publicar mis figuritas</strong>. Puedes pegar la lista desde la app <strong>Figuritas App</strong>. La publicacion dura 15 dias y puedes renovarla.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Guarda tu enlace privado</div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.5 }}>
              Al publicar recibes un <strong>enlace unico</strong>. Guardalo — con ese enlace puedes editar tu lista o cerrar tu publicacion.
            </div>
          </div>

          <div className="security-note">
            <span>Coordina siempre en un lugar publico. No compartas tu direccion exacta.</span>
          </div>

          <button className="btn btn-primary btn-full" onClick={() => setOpen(false)}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
