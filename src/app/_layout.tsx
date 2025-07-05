import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/src/hooks/useFrameworkReady';
import { useAuthCheck } from '@/src/hooks/useAuthCheck';
import AuthScreen from './auth';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';

export default function RootLayout() {
  useFrameworkReady();
  const { loading, authenticated } = useAuthCheck();

  useEffect(() => {
    // Listener para deep links
    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url.includes('auth/callback')) {
        console.log('Utilizador confirmou email via deep link!');
        // O supabase vai automaticamente atualizar o estado de auth
      }
    });

    // Listener para mudanças no estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log('Utilizador autenticado:', session.user.email);
        }
        if (event === 'SIGNED_OUT') {
          console.log('Utilizador fez logout');
        }
      },
    );

    return () => {
      subscription?.remove();
      authListener.subscription?.unsubscribe();
    };
  }, []);

  if (loading) return null; // ou um spinner bonito

  return (
    <>
      {authenticated ? (
        <>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </>
      ) : (
        <>
          <AuthScreen />
          <StatusBar style="auto" />
        </>
      )}
    </>
  );
}
