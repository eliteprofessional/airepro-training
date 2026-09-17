import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppShell from './components/AppShell';
import { RequireAuth, RequireAdmin } from './components/RequireAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MyTrainingPage from './pages/MyTrainingPage';
import OperationsPage from './pages/OperationsPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import DecisionGuidesPage from './pages/DecisionGuidesPage';
import SopsPage from './pages/SopsPage';
import QuizzesPage from './pages/QuizzesPage';
import CertificationsPage from './pages/CertificationsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ProfilePage from './pages/ProfilePage';
import DocumentPage from './pages/DocumentPage';
import NotFoundPage from './pages/NotFoundPage';
import {
  AdminHomePage,
  AdminDocumentsPage,
  AdminDocumentFormPage,
  AdminUsersPage,
  AdminCertificationsPage,
  AdminAnnouncementsPage,
} from './pages/admin/AdminPages';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/training" element={<MyTrainingPage />} />
            <Route path="/training/:slug" element={<MyTrainingPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/operations/:category" element={<OperationsPage />} />
            <Route path="/knowledge" element={<KnowledgeBasePage />} />
            <Route path="/decision-guides" element={<DecisionGuidesPage />} />
            <Route path="/decision-guides/:slug" element={<DecisionGuidesPage />} />
            <Route path="/sops" element={<SopsPage />} />
            <Route path="/quizzes" element={<QuizzesPage />} />
            <Route path="/quizzes/:slug" element={<QuizzesPage />} />
            <Route path="/certifications" element={<CertificationsPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/docs/:slug" element={<DocumentPage />} />
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminHomePage />} />
              <Route path="/admin/documents" element={<AdminDocumentsPage />} />
              <Route path="/admin/documents/new" element={<AdminDocumentFormPage mode="new" />} />
              <Route path="/admin/documents/:id" element={<AdminDocumentFormPage mode="edit" />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/certifications" element={<AdminCertificationsPage />} />
              <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
