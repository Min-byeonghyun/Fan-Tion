import NaverLoginButton from '@components/NaverComponent/NaverLoginButton';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { membersApi } from '../../api/member';
import { Styled } from '../../styled-components/AuthStyle';
import { setAccessToken } from '@utils/tokenStorage';

const errorMessages = {
  emptyFields: '이메일 또는 비밀번호가 올바르지 않습니다.',
};

export default function SignInForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = formData;
    try {
      const response = await membersApi.signIn({ email, password });

      console.log(response);
      // 액세스 토큰을 인메모리에 저장 (리프레시 토큰은 httpOnly 쿠키로 서버에서 설정됨)
      setAccessToken(response.data.accessToken);

      // 로그인 성공 처리
      navigate('/');
    } catch (error) {
      console.error(error);
      // 로그인 실패 처리 (예: 에러 메시지 표시)
      setError(errorMessages.emptyFields);
    }
  };

  return (
    <Styled.OuterWrapper>
      <Styled.Wrapper>
        <Styled.Title>로그인</Styled.Title>
        <Styled.Form onSubmit={handleSubmit}>
          <Styled.Input
            name="email"
            placeholder="이메일"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <Styled.Input
            name="password"
            placeholder="비밀번호"
            type="password"
            value={formData.password}
            onChange={handleChange}
          />
          {error && <Styled.ErrorMessage>{error}</Styled.ErrorMessage>}
          <Styled.Input type="submit" value="로그인" />
        </Styled.Form>
        <NaverLoginButton />
        <Styled.Switcher>
          비밀번호를 잊어버리셨나요?{' '}
          <Link to="/findpassword">비밀번호 찾기</Link>
        </Styled.Switcher>
        <Styled.Switcher>
          회원이 아니신가요? <Link to="/signup">회원가입</Link>
        </Styled.Switcher>
      </Styled.Wrapper>
    </Styled.OuterWrapper>
  );
}
