import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PublishPage from './pages/PublishPage'
import ListingPage from './pages/ListingPage'
import EditPage from './pages/EditPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/publicar" element={<PublishPage />} />
        <Route path="/publicacion/:id" element={<ListingPage />} />
        <Route path="/editar/:id" element={<EditPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}
