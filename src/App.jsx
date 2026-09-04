import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import RequireAdmin from './components/admin/RequireAdmin';
import NotFoundPage from './pages/NotFoundPage';
import SupportPage from './pages/support/SupportPage';
import SupportDocumentPage from './pages/support/SupportDocumentPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDocumentsPage from './pages/admin/AdminDocumentsPage';
import AdminDocumentNewPage from './pages/admin/AdminDocumentNewPage';
import AdminDocumentEditPage from './pages/admin/AdminDocumentEditPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/support" replace />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/support/:slug" element={<SupportDocumentPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<RequireAdmin />}>
          <Route index element={<AdminDocumentsPage />} />
          <Route path="documents/new" element={<AdminDocumentNewPage />} />
          <Route path="documents/:slug/edit" element={<AdminDocumentEditPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
