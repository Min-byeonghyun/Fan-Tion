import { getAccessToken, removeAccessToken, setAccessToken } from '@utils/tokenStorage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// axios instance creation.
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100000,
  headers: {
    withCredentials: true,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0',
  },
});

// 리프레시 토큰 요청 중인지 확인하는 플래그
let isRefreshing = false;
// 리프레시 토큰 요청 동안 대기 중인 요청들을 저장하는 배열
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

// 대기 중인 요청들을 처리하는 함수
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// 요청 인터셉터 추가
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 요청 헤더에 인증 토큰 추가
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; //요청 헤더에 토큰 추가
    }
    // console.log('Request Config:', config);
    return config;
  },
  (error: any) => {
    // 요청 에러 처리
    return Promise.reject(error);
  },
);

// 응답 인터셉터 추가
axiosInstance.interceptors.response.use(
  (response: any) => {
    // 2xx 범위에 있는 상태 코드는 이 함수를 트리거 합니다.
    // 응답 데이터를 처리하고 반환
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 에러이고, 리프레시를 아직 시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 리프레시 중이면 큐에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 리프레시 토큰 API 호출 (httpOnly 쿠키에 있는 리프레시 토큰 사용)
        const response = await axios.post(
          `${API_BASE_URL}/members/refresh`,
          {},
          {
            withCredentials: true,
          },
        );

        const newAccessToken = response.data.data?.accessToken;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          isRefreshing = false;

          // 원래 요청을 재시도
          return axiosInstance(originalRequest);
        } else {
          throw new Error('액세스 토큰이 응답에 없습니다.');
        }
      } catch (refreshError) {
        // 리프레시 실패 시 로그아웃 처리
        processQueue(refreshError, null);
        removeAccessToken();
        isRefreshing = false;

        // 로그인 페이지로 리다이렉트 (필요시)
        // window.location.href = '/signin';

        return Promise.reject(refreshError);
      }
    }

    // 401 에러가 아니거나 리프레시를 이미 시도한 경우 그대로 에러 반환
    return Promise.reject(error);
  },
);

export async function uploadMultipartData<T>(
  url: string,
  data: Record<string, any>,
): Promise<T> {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (Array.isArray(data[key])) {
      data[key].forEach((file: File) => {
        formData.append(key, file);
      });
    } else {
      formData.append(key, data[key]);
    }
  });

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  return axiosInstance.post(url, formData, config);
}
export async function uploadModifiedData<T>(
  url: string,
  data: Record<string, any>,
): Promise<T> {
  const formData = new FormData();

  Object.keys(data).forEach(key => {
    if (Array.isArray(data[key])) {
      data[key].forEach((item: string | File, index: number) => {
        if (item instanceof File) {
          // 파일인 경우 FormData에 추가
          formData.append(`${key}[${index}].type`, 'file');
          formData.append(`${key}[${index}].value`, item);
        } else {
          // 문자열인 경우 URL로 처리
          formData.append(`${key}[${index}].type`, 'url');
          formData.append(`${key}[${index}].value`, item);
        }
      });
    } else if (key === 'request') {
      // JSON payload를 'request'라는 key에 추가
      formData.append(
        key,
        new Blob([JSON.stringify(data[key])], { type: 'application/json' }),
      );
    } else {
      formData.append(key, data[key]);
    }
  });

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  return axiosInstance.put(url, formData, config);
}

// async function fetchCall<T>(
//   url: string,
//   method: 'get' | 'post' | 'put' | 'delete',
//   data?: any
// ): Promise<T> {
//   const config = {
//     method,
//     url,
//     ...(data && { data }), // data가 있을 경우에만 data 속성 추가
//   };
//   return axiosInstance(config);
// }

// Usage
// const id = 123;
// const result = await fetchCall<{ message: string }>(`/posts`, 'post', {
//   itemId: id,
// });
// console.log(result.message);
