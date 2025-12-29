import { naverLoginApi } from '@api/naverLogin';
import { setAccessToken } from '@utils/tokenStorage';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function NaverLoginCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleNaverSignin = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (!code || !state) {
          throw new Error('Code or state is missing');
        }

        // 네이버 로그인 API 호출
        const response = await naverLoginApi.naverSignin(code, state);
        console.log('API 응답:', response);

        const accessToken = response.data.accessToken;
        // 액세스 토큰을 인메모리에 저장 (리프레시 토큰은 httpOnly 쿠키로 서버에서 설정됨)
        setAccessToken(accessToken);

        console.log('로그인 성공, 홈으로 이동');
        navigate('/');
      } catch (error) {
        console.log('네이버 로그인 실패', error);
        navigate('/signin');
      }
    };

    handleNaverSignin();
  }, [navigate, location.search]);

  return null;
}
