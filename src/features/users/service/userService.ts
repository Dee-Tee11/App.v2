import { supabase } from '@/src/lib/supabase';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

export const signUp = async (
  email: string,
  password: string,
  nifToSave: string | null,
) => {
  const redirectTo =
    Constants.appOwnership === 'expo'
      ? Linking.createURL('auth/callback')
      : 'myapp://auth/callback';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) throw error;

  const user = data?.user;
  if (!user?.id) {
    throw new Error('ID do utilizador não encontrado após signUp.');
  }

  // Option 1: Try immediate insert (might fail due to RLS timing)
  try {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        nif: nifToSave,
      });

    if (!profileError) {
      return data;
    }

    // If immediate insert fails with RLS error, don't throw - user signup was successful
    if (profileError.code === '42501') {
      console.log('Profile will be created after email confirmation');
      return data;
    }

    // For other errors, log but don't fail the signup
    console.error('Erro ao criar perfil:', profileError);
  } catch (insertError) {
    console.error('Erro inesperado ao criar perfil:', insertError);
  }

  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
};

// Alternative approach: Create profile after email confirmation
export const createUserProfile = async (nif: string | null = null) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Utilizador não autenticado');
  }

  const { data, error } = await supabase.from('user_profiles').insert({
    id: user.id,
    nif: nif,
  });

  if (error) {
    console.error('Erro ao criar perfil:', error);
    throw error;
  }

  return data;
};

// Função para validar força da password
export const validatePasswordStrength = (
  password: string,
): {
  isValid: boolean;
  message?: string;
  score: number; // 0-4 (0=muito fraca, 4=muito forte)
} => {
  let score = 0;
  const issues: string[] = [];

  // Comprimento mínimo
  if (password.length < 8) {
    issues.push('pelo menos 8 caracteres');
  } else if (password.length >= 12) {
    score += 1;
  }

  // Letra minúscula
  if (!/(?=.*[a-z])/.test(password)) {
    issues.push('uma letra minúscula');
  } else {
    score += 1;
  }

  // Letra maiúscula
  if (!/(?=.*[A-Z])/.test(password)) {
    issues.push('uma letra maiúscula');
  } else {
    score += 1;
  }

  // Número
  if (!/(?=.*\d)/.test(password)) {
    issues.push('um número');
  } else {
    score += 1;
  }

  // Caractere especial
  if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
    issues.push('um caractere especial (!@#$%^&*...)');
  } else {
    score += 1;
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      message: `A password deve ter ${issues.join(', ')}`,
      score: Math.max(0, score - 1),
    };
  }

  return { isValid: true, score };
};
