import axios, { AxiosInstance, AxiosResponse, AxiosError, CancelTokenSource, InternalAxiosRequestConfig } from 'axios'
import { createProxyPattern, createServiceConfig } from '~/env.config'

const { otherBaseURL } = createServiceConfig(import.meta.env)

const isHttpProxy = import.meta.env.VITE_HTTP_PROXY === 'Y'

interface ApiResponse<T> {
  data: T
  status: number
}

// createaxiosinstance function
function createHttpClient(baseURL: string): AxiosInstance {
  const httpClient: AxiosInstance = axios.create({
    baseURL: baseURL,
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 10000 // Default request timeout settings
  })

  // request interceptor
  httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Remove all values ​​​​asnullfields
    const params = config.params || {}
    Object.keys(params).forEach(key => params[key] === null && delete params[key])
    const data = config.data || {}
    Object.keys(data).forEach(key => data[key] === null && delete data[key])

    // Add tox-tokento the request header
    const authToken = 'your_token_here' // Should be obtained from environment variables or other safe locations
    if (config.headers) {
      config.headers['x-token'] = authToken
    }

    return config
  }, errorHandler)

  // response interceptor
  httpClient.interceptors.response.use((response: AxiosResponse) => {
    // Some response data processing or status code checking is performed here.
    return response
  }, errorHandler)

  return httpClient
}

// error handling function
function errorHandler(error: AxiosError) {
  if (error.response) {
    console.error(`API Error: ${error.response.status} - ${error.response.statusText}`)
  } else if (error.request) {
    console.error('No response received for request.')
  } else {
    console.error('Error setting up request:', error.message)
  }
  return Promise.reject(error)
}

// Create request cancellation logic
function createCancelTokenSource() {
  let cancelTokenSource: CancelTokenSource = axios.CancelToken.source()

  function getRequestCancelToken() {
    cancelTokenSource.cancel('Cancelled the previous request.')
    cancelTokenSource = axios.CancelToken.source()
    return cancelTokenSource.token
  }

  return getRequestCancelToken
}

// Encapsulated request method
// Encapsulated request method，Make adjustments here to suitDEVResponse<T>type
function createRequestFunctions(httpClient: AxiosInstance) {
  const getRequestCancelToken = createCancelTokenSource()

  return {
    get<T>(url: string, params?: object, cancelPrevious: boolean = false): Promise<ApiResponse<T>> {
      const cancelToken = cancelPrevious ? getRequestCancelToken() : undefined
      return httpClient.get<App.Service.DEVResponse<T>>(url, { params, cancelToken }).then(response => ({
        data: response.data.data, // adaptDEVResponse<T>structure
        status: response.status
      }))
    },
    post<T>(url: string, data?: object, cancelPrevious: boolean = false): Promise<ApiResponse<T>> {
      const cancelToken = cancelPrevious ? getRequestCancelToken() : undefined
      return httpClient.post<App.Service.DEVResponse<T>>(url, data, { cancelToken }).then(response => ({
        data: response.data.data, // adaptDEVResponse<T>structure
        status: response.status
      }))
    },
    put<T>(url: string, data?: object, cancelPrevious: boolean = false): Promise<ApiResponse<T>> {
      const cancelToken = cancelPrevious ? getRequestCancelToken() : undefined
      return httpClient.put<App.Service.DEVResponse<T>>(url, data, { cancelToken }).then(response => ({
        data: response.data.data, // adaptDEVResponse<T>structure
        status: response.status
      }))
    },
    delete<T>(url: string, params?: object, cancelPrevious: boolean = false): Promise<ApiResponse<T>> {
      const cancelToken = cancelPrevious ? getRequestCancelToken() : undefined
      return httpClient.delete<App.Service.DEVResponse<T>>(url, { params, cancelToken }).then(response => ({
        data: response.data.data, // adaptDEVResponse<T>structure
        status: response.status
      }))
    }
    // More can be added as neededHTTPmethod
  }
}

const request = createRequestFunctions(createHttpClient(isHttpProxy ? createProxyPattern() : otherBaseURL.demo)) // actual environmentURLas an example
const mockRequest = createRequestFunctions(createHttpClient(otherBaseURL.mock)) // simulated environmentURLas an example

export { request, mockRequest }
