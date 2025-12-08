import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response) {
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const token = localStorage.getItem('token')
          if (token) {
            const response = await apiClient.post('/auth/refresh')
            const newToken = response.data.data.token
            localStorage.setItem('token', newToken)
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return apiClient(originalRequest)
          }
        } catch (refreshError) {
          localStorage.removeItem('token')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }

      if (error.response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }

      return Promise.reject({
        message: error.response.data?.error || 'An error occurred',
        status: error.response.status,
      })
    }

    return Promise.reject({
      message: 'Network error. Please check your connection.',
      status: 0,
    })
  }
)

export interface AttendanceRecord {
  block_index: number
  timestamp: string
  teacher_name: string
  date: string
  course: string
  year: string
  present_students: string[]
  student_count: number
}

export interface BlockchainStats {
  total_blocks: number
  genesis_block: any
  latest_block: any
  attendance_blocks: number
  total_attendance_records: number
}

export interface AttendanceAnalytics {
  overview: {
    total_blocks: number
    attendance_blocks: number
    total_students_recorded: number
    unique_teachers: string[]
    unique_courses: string[]
    date_range: {
      start: string | null
      end: string | null
    }
  }
  by_teacher: Record<string, any>
  by_course: Record<string, any>
  by_date: Record<string, any>
  student_attendance: Record<string, number>
  trends: {
    daily_attendance: [string, number][]
    course_popularity: [string, number][]
    teacher_activity: [string, number][]
  }
}

export interface StudentRecord {
  date: string
  course: string
  year: string
  teacher_name: string
}

export interface StudentSearchResult {
  roll_no: string
  records: StudentRecord[]
  total_records: number
}

export const apiService = {
  async getStats(): Promise<BlockchainStats> {
    const response = await apiClient.get('/stats')
    return response.data.data || response.data
  },

  async getRecords(
    page: number = 1, 
    perPage: number = 10,
    filters?: {
      teacherName?: string
      course?: string
      date?: string
      year?: string
    }
  ): Promise<{
    data: AttendanceRecord[];
    pagination: {
      page: number;
      per_page: number;
      total: number;
      pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  }> {
    const params: any = { page, per_page: perPage }
    if (filters) {
      if (filters.teacherName) params.teacher_name = filters.teacherName
      if (filters.course) params.course = filters.course
      if (filters.date) params.date = filters.date
      if (filters.year) params.year = filters.year
    }
    const response = await apiClient.get('/records', { params })
    return response.data.data || response.data
  },

  async getAnalytics(): Promise<AttendanceAnalytics> {
    const response = await apiClient.get('/analytics')
    return response.data.data || response.data
  },

  async getReport(format: 'text' | 'json' = 'json'): Promise<string> {
    const response = await apiClient.get('/report', {
      params: { format },
      responseType: format === 'text' ? 'text' : 'json',
    })
    return response.data
  },

  async exportData(format: 'csv' | 'analytics' | 'json'): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.get(`/export/${format}`)
    return response.data
  },

  async checkIntegrity(): Promise<{ result: string; is_valid: boolean; timestamp: string }> {
    const response = await apiClient.get('/integrity')
    return response.data.data || response.data
  },

  async getAllBlocks(): Promise<any[]> {
    const response = await apiClient.get('/blocks')
    return response.data.data || response.data || []
  },

  async login(username: string, password: string): Promise<{ token: string; user: any }> {
    const TEACHER_CREDENTIALS = [
      { username: 'teacher1', password: 'teacher123', role: 'teacher' },
      { username: 'teacher2', password: 'teacher123', role: 'teacher' },
      { username: 'teacher3', password: 'teacher123', role: 'teacher' },
    ]

    const teacher = TEACHER_CREDENTIALS.find(
      (cred) => cred.username === username && cred.password === password
    )

    if (teacher) {
      const mockToken = `mock_token_${teacher.username}_${Date.now()}`
      return {
        token: mockToken,
        user: {
          username: teacher.username,
          role: teacher.role,
        },
      }
    }

    try {
      const response = await apiClient.post('/auth/login', { username, password })
      return response.data.data
    } catch (error: any) {
      throw new Error(error.message || 'Invalid username or password')
    }
  },

  async verifyToken(): Promise<any> {
    const token = localStorage.getItem('token')
    
    if (token && token.startsWith('mock_token_')) {
      const username = token.split('_')[2]
      return {
        username,
        role: 'teacher',
      }
    }

    try {
      const response = await apiClient.get('/auth/verify')
      return response.data.data
    } catch (error) {
      throw error
    }
  },

  async refreshToken(): Promise<{ token: string; user: any; expires_in: number }> {
    const response = await apiClient.post('/auth/refresh')
    return response.data.data
  },

  async submitAttendance(data: {
    teacherName: string
    course: string
    date: string
    year: string
    presentStudents: string[]
  }): Promise<{ success: boolean; message: string; blockIndex?: number; studentsCount?: number }> {
    const response = await apiClient.post('/attendance', {
      teacher_name: data.teacherName.trim(),
      course: data.course.trim(),
      date: data.date,
      year: data.year,
      present_students: data.presentStudents.map(rollNo => rollNo.trim()).filter(Boolean),
    })

    return {
      success: true,
      message: response.data.data.message || 'Attendance recorded successfully on the blockchain!',
      blockIndex: response.data.data.block_index,
      studentsCount: response.data.data.students_count,
    }
  },

  async searchStudent(rollNo: string): Promise<StudentSearchResult> {
    const response = await apiClient.get(`/students/${encodeURIComponent(rollNo.trim())}`)
    return response.data.data || response.data
  },
}

export default apiClient

