/**
 * 액세스 토큰을 인메모리로 관리하는 유틸리티
 */

let accessToken: string | null = null;

/**
 * 액세스 토큰을 저장합니다.
 * @param token 저장할 액세스 토큰
 */
export const setAccessToken = (token: string): void => {
  accessToken = token;
};

/**
 * 저장된 액세스 토큰을 반환합니다.
 * @returns 저장된 액세스 토큰 또는 null
 */
export const getAccessToken = (): string | null => {
  return accessToken;
};

/**
 * 저장된 액세스 토큰을 제거합니다.
 */
export const removeAccessToken = (): void => {
  accessToken = null;
};

/**
 * 액세스 토큰이 존재하는지 확인합니다.
 * @returns 토큰이 존재하면 true, 없으면 false
 */
export const hasAccessToken = (): boolean => {
  return accessToken !== null;
};

