import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import RequireAdmin from './components/admin/RequireAdmin';
import NotFoundPage from './pages/NotFoundPage';
import TrainingPage from './pages/training/TrainingPage';
import TrainingDocumentPage from './pages/training/TrainingDocumentPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDocumentsPage from './pages/admin/AdminDocumentsPage';
import AdminDocumentNewPage from './pages/admin/AdminDocumentNewPage';
import AdminDocumentEditPage from './pages/admin/AdminDocumentEditPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/training" replace />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/training/:slug" element={<TrainingDocumentPage />} />
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
