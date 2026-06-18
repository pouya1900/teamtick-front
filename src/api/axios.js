import axios from 'axios'
import { i18n } from '../i18n'

const API_URL = 'http://localhost:8000/api'

const apiClient = axios.create({
    baseURL: API_URL,
})

apiClient.interceptors.request.use((config) => {
    config.headers['Accept-Language'] = i18n.global.locale.value
    return config
})

export default apiClient