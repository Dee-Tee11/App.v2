// app/AuthGate.tsx
import { useAuthCheck } from '@/src/hooks/useAuthCheck';
import AuthScreen from './auth'; // criamos já a seguir
import ScannerScreen from './(tabs)';

export default function AuthGate() {
  const { loading, authenticated } = useAuthCheck();

  if (loading) return null; // ou um spinner
  return authenticated ? <ScannerScreen /> : <AuthScreen />;
}
