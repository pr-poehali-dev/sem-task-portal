import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (localStorage.getItem('sem_token')) navigate('/dashboard');
    else navigate('/login');
  }, [navigate]);
  return null;
};

export default Index;
