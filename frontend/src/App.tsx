import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "@/components/layout/Layout";
import TeacherRoute from "@/components/TeacherRoute";
import { Skeleton } from "@/components/ui/skeleton";

const HomePage = lazy(() => import("@/pages/HomePage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const AttendancePage = lazy(() => import("@/pages/AttendancePage"));
const RecordsPage = lazy(() => import("@/pages/RecordsPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const IntegrityPage = lazy(() => import("@/pages/IntegrityPage"));
const StudentSearchPage = lazy(() => import("@/pages/StudentSearchPage"));
const AddClassPage = lazy(() => import("@/pages/AddClassPage"));
const ClassroomsPage = lazy(() => import("@/pages/ClassroomsPage"));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <div className="space-y-3 text-center">
        <Skeleton className="mx-auto h-10 w-48 rounded" />
        <Skeleton className="mx-auto h-4 w-32 rounded" />
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
            <Toaster />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
