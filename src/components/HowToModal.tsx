import { useState } from 'react'

export default function HowToModal() {
  const [open, setOpen] = useState(false)

  if (!open) return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={() => setOpen(true)}
      style={{ fontSize: 13, color: 'var(--gray-500)' }}
    >
      ❓ ¿Cómo usar esta página?
    </button>
  )

  return (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>⚽ ¿Cómo usar esta página?</div>
          <button onClick={() => setOpen(false)} style={{ fontSize: 20, color: 'var(--gray-400)', padding: 4 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>🔍</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Busca una figurita</div>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.5 }}>
                Usa el buscador para encontrar el país o número que te falta. También puedes filtrar por sector de Cartagena o por modalidad (intercambio o venta).
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>💬</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Contacta a quien la tiene</div>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.5 }}>
                Haz clic en <strong>WhatsApp</strong> para escribirle directamente a la persona. Coordina el intercambio en un lugar público y seguro.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>📋</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Publica tus repetidas</div>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.5 }}>
                Haz clic en <strong>"Publicar mis figuritas"</strong>. Puedes pegar la lista directamente desde la app <strong>Figuritas App</strong>. Tu publicación dura 15 días y puedes renovarla.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>🔐</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Guarda tu enlace privado</div>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.5 }}>
                Cuando publiques, recibes un <strong>enlace único</strong>. Guárdalo — con ese enlace puedes editar tu lista, marcar figuritas como vendidas o cerrar tu publicación.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>⭐</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Lista de Michel</div>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.5 }}>
                Al final de la página está la lista de Michel con sus repetidas y faltantes. Puedes comparar tu lista con la de él para ver qué pueden intercambiar.
              </div>
            </div>
          </div>

          <div className="security-note">
            <span>⚠️</span>
            <span>Coordina siempre en un lugar público. No compartas tu dirección exacta.</span>
          </div>

          <button className="btn btn-primary btn-full" onClick={() => setOpen(false)}>
            ¡Entendido, a buscar figuritas!
          </button>
        </div>
      </div>
    </div>
  )
}
