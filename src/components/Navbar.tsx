import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          ⚽ <span>Figuritas</span> Cartagena
        </Link>
        <Link to="/publicar" className="btn btn-primary btn-sm">
          + Publicar figuritas
        </Link>
      </div>
    </nav>
  )
}
