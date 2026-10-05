import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  async error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth
export const authAPI = {
  register: (d: any) => api.post('/auth/register', d),
  login:    (d: any) => api.post('/auth/login', d),
  me:       ()       => api.get('/auth/me'),
}

// Predictions — ML models
export const predictAPI = {
  disease:  (file: File, lat?: number, lng?: number) => {
    const fd = new FormData()
    fd.append('image', file)
    if (lat) fd.append('latitude', String(lat))
    if (lng) fd.append('longitude', String(lng))
    return api.post('/predict/disease', fd)
  },
  yield:    (data: any) => api.post('/predict/yield',    data),
  maturity: (data: any) => api.post('/predict/maturity', data),
  variety:  (data: any) => api.post('/predict/variety',  data),
  pest:     (data: any) => api.post('/predict/pest',     data),

  // Rule-based detections
  cropHealth:    (data: any) => api.post('/predict/crop-health',    data),
  waterStress:   (data: any) => api.post('/predict/water-stress',   data),
  drought:       (data: any) => api.post('/predict/drought',        data),
  soilCondition: (data: any) => api.post('/predict/soil-condition', data),
  growthStage:   (data: any) => api.post('/predict/growth-stage',   data),
  weatherImpact: (data: any) => api.post('/predict/weather-impact', data),

  feedback: (data: any) => api.post('/predict/feedback', data),
}

// Scans
export const scanAPI = {
  history:          (params?: any)  => api.get('/scans/history', { params }),
  stats:            ()              => api.get('/scans/stats'),
  fieldPerformance: (params?: any)  => api.get('/scans/field-performance', { params }),
}

// Admin
export const adminAPI = {
  dashboard:     () => api.get('/admin/dashboard'),
  users:         () => api.get('/admin/users'),
  diseaseTrends: () => api.get('/admin/disease-trends'),
  changeRole:    (userId: string, role: string) => api.patch(`/admin/users/${userId}/role?role=${role}`),
  toggleUser:    (userId: string) => api.patch(`/admin/users/${userId}/toggle`),
}
