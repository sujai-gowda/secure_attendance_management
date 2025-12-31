import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "@/components/layout/Layout";
import TeacherRoute from "@/components/TeacherRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import AttendancePage from "@/pages/AttendancePage";
import RecordsPage from "@/pages/RecordsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import IntegrityPage from "@/pages/IntegrityPage";
import StudentSearchPage from "@/pages/StudentSearchPage";
import AddClassPage from "@/pages/AddClassPage";
import ClassroomsPage from "@/pages/ClassroomsPage";

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
                          <TeacherRoute>
                            <ErrorBoundary>
                              <AttendancePage />
                            </ErrorBoundary>
                          </TeacherRoute>
                        }
                      />
                      <Route path="/records" element={<RecordsPage />} />
                      <Route path="/students" element={<StudentSearchPage />} />
                      <Route
                        path="/add-class"
                        element={
                          <TeacherRoute>
                            <ErrorBoundary>
                              <AddClassPage />
                            </ErrorBoundary>
                          </TeacherRoute>
                        }
                      />
                      <Route
                        path="/classrooms"
                        element={
                          <TeacherRoute>
                            <ErrorBoundary>
                              <ClassroomsPage />
                            </ErrorBoundary>
                          </TeacherRoute>
                        }
                      />
                      <Route
                        path="/analytics"
                        element={
                          <TeacherRoute>
                            <ErrorBoundary>
                              <AnalyticsPage />
                            </ErrorBoundary>
                          </TeacherRoute>
                        }
                      />
                      <Route path="/integrity" element={<IntegrityPage />} />
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
  );
}

export default App;
