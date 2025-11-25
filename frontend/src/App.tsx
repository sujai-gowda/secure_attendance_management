import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import AttendancePage from '@/pages/AttendancePage'
import RecordsPage from '@/pages/RecordsPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import IntegrityPage from '@/pages/IntegrityPage'
import StudentSearchPage from '@/pages/StudentSearchPage'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ErrorBoundary>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route
                        path="/attendance"
                        element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <AttendancePage />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/records" element={<RecordsPage />} />
                      <Route path="/students" element={<StudentSearchPage />} />
                      <Route
                        path="/analytics"
                        element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <AnalyticsPage />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/integrity"
                        element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <IntegrityPage />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </Layout>
                </ErrorBoundary>
              }
            />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

