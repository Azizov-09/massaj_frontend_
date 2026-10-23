import { useEffect } from 'react';
import { AppRouter } from './router';
import { useStore } from './store';

export default function App() {
  useEffect(() => {
    const handleSessionExpired = () => {
      useStore.getState().expireSession();
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  return <AppRouter />;
}
