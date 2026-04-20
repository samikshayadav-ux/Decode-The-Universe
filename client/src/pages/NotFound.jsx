import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FaRocket, FaHome, FaSearch } from 'react-icons/fa';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  text-align: center;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 6rem;
  margin: 0;
  background: linear-gradient(90deg, #00dbde 0%, #fc00ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 10px rgba(0, 219, 222, 0.5));
`;

const Subtitle = styled.h2`
  font-size: 2rem;
  margin: 1rem 0;
  color: #e6e6e6;
`;

const Description = styled.p`
  font-size: 1.2rem;
  max-width: 600px;
  margin-bottom: 3rem;
  color: #b8b8b8;
  line-height: 1.6;
`;

const Rocket = styled(FaRocket)`
  font-size: 8rem;
  margin-bottom: 2rem;
  color: #4832a8;
  animation: ${float} 4s ease-in-out infinite;
  transform-origin: center bottom;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:nth-child(1) {
    background: linear-gradient(90deg, #00dbde 0%, #fc00ff 100%);
    color: white;
  }
  
  &:nth-child(2) {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const Stars = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
`;

const Star = styled.div`
  position: absolute;
  background-color: white;
  border-radius: 50%;
  animation: twinkle ${props => props.duration || '5s'} infinite ease-in-out;
  
  @keyframes twinkle {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 1; }
  }
`;

const generateStars = () => {
  const stars = [];
  for (let i = 0; i < 100; i++) {
    const size = Math.random() * 3;
    stars.push(
      <Star 
        key={i}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          duration: `${5 + Math.random() * 10}s`,
          delay: `${Math.random() * 5}s`
        }}
      />
    );
  }
  return stars;
};

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Stars>{generateStars()}</Stars>
      <Rocket />
      <Title>404</Title>
      <Subtitle>Opps!, we have a problem!</Subtitle>
      <Description>
        The page you're looking for seems to have been lost in space.
        Don't worry, our team of highly trained astronauts is working to bring it back.
      </Description>
      <ButtonContainer>
        <Button onClick={() => navigate('/')}>
          <FaHome /> Back to Home
        </Button>
        <Button onClick={() => window.history.back()}>
          <FaSearch /> Go Back
        </Button>
      </ButtonContainer>
    </Container>
  );
};

export default NotFound;