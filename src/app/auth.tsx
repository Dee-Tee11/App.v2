import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { signUp, signIn } from '../features/users/service/userService';
import { styles } from '@/src/_styles/Auth.styles';

export default function AuthScreen() {
  const [step, setStep] = useState<
    'question' | 'login' | 'magicLink' | 'password' | 'nif'
  >('question');

  // Usar useRef para evitar logs duplos em desenvolvimento
  const hasLoggedInitialRender = useRef(false);

  useEffect(() => {
    if (!hasLoggedInitialRender.current) {
      console.log('Valor inicial do step:', step);
      hasLoggedInitialRender.current = true;
    }
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nif, setNif] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Memoizar os valores animados para evitar recriações
  const animatedValues = useMemo(
    () => ({
      questionOpacity: new Animated.Value(1),
      loginOpacity: new Animated.Value(0),
      magicLinkOpacity: new Animated.Value(0),
      nifOpacity: new Animated.Value(0),
      passwordOpacity: new Animated.Value(0),
    }),
    [],
  );

  // Flag para controlar se é o primeiro render
  const isInitialRender = useRef(true);

  // Controla as animações quando o step muda
  useEffect(() => {
    // Se for o primeiro render, não fazer animação
    if (isInitialRender.current) {
      isInitialRender.current = false;
      setIsReady(true);
      return;
    }

    const animationDuration = 300;
    const animationConfig = {
      duration: animationDuration,
      useNativeDriver: true,
    };

    const resetAnimations = [
      Animated.timing(animatedValues.questionOpacity, {
        toValue: 0,
        ...animationConfig,
      }),
      Animated.timing(animatedValues.loginOpacity, {
        toValue: 0,
        ...animationConfig,
      }),
      Animated.timing(animatedValues.magicLinkOpacity, {
        toValue: 0,
        ...animationConfig,
      }),
      Animated.timing(animatedValues.nifOpacity, {
        toValue: 0,
        ...animationConfig,
      }),
      Animated.timing(animatedValues.passwordOpacity, {
        toValue: 0,
        ...animationConfig,
      }),
    ];

    let currentStepAnimation;
    switch (step) {
      case 'question':
        currentStepAnimation = Animated.timing(animatedValues.questionOpacity, {
          toValue: 1,
          ...animationConfig,
        });
        break;
      case 'login':
        currentStepAnimation = Animated.timing(animatedValues.loginOpacity, {
          toValue: 1,
          ...animationConfig,
        });
        break;
      case 'magicLink':
        currentStepAnimation = Animated.timing(
          animatedValues.magicLinkOpacity,
          {
            toValue: 1,
            ...animationConfig,
          },
        );
        break;
      case 'password':
        currentStepAnimation = Animated.timing(animatedValues.passwordOpacity, {
          toValue: 1,
          ...animationConfig,
        });
        break;
      case 'nif':
        currentStepAnimation = Animated.timing(animatedValues.nifOpacity, {
          toValue: 1,
          ...animationConfig,
        });
        break;
    }

    Animated.sequence([
      Animated.parallel(resetAnimations),
      currentStepAnimation,
    ]).start(() => {
      setIsReady(true);
    });
  }, [step, animatedValues]);

  // Memoizar validações para evitar recriações
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }, []);

  const validateNIF = useCallback((nif: string): boolean => {
    // Remove espaços e verifica se tem 9 dígitos
    const cleanNif = nif.replace(/\s/g, '');
    if (cleanNif.length !== 9 || !/^\d{9}$/.test(cleanNif)) {
      return false;
    }

    // Algoritmo de validação do NIF português
    const digits = cleanNif.split('').map(Number);
    const sum = digits.slice(0, 8).reduce((acc, digit, index) => {
      return acc + digit * (9 - index);
    }, 0);

    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? 0 : 11 - remainder;

    return digits[8] === checkDigit;
  }, []);

  const handleMagicLink = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, insira um email.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Erro', 'Por favor, insira um email válido.');
      return;
    }

    animatedStepTransition('password');
  }, [email, validateEmail]);

  const handleSignUp = useCallback(
    async (skipNif: boolean = false) => {
      if (!email.trim()) {
        Alert.alert('Erro', 'Por favor, insira um email válido.');
        return;
      }

      if (!validateEmail(email)) {
        Alert.alert('Erro', 'Por favor, insira um email válido.');
        return;
      }

      if (!password.trim()) {
        Alert.alert('Erro', 'Por favor, insira uma password.');
        return;
      }

      if (password.length < 8) {
        Alert.alert('Erro', 'A password deve ter pelo menos 8 caracteres.');
        return;
      }

      if (!skipNif && nif.trim() && !validateNIF(nif.trim())) {
        Alert.alert('Erro', 'Por favor, insira um NIF válido (9 dígitos).');
        return;
      }

      setIsLoading(true);
      try {
        const nifToSave = skipNif ? null : nif.trim() || null;
        await signUp(email.trim(), password, nifToSave);
        Alert.alert(
          'Email Enviado!',
          'Verifique o seu email e clique no link para confirmar a conta. A aplicação irá abrir automaticamente.',
          [{ text: 'OK' }],
        );
      } catch (error) {
        console.error('Erro no signup:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        Alert.alert('Erro', `Falha ao enviar link: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, nif, validateEmail, validateNIF],
  );

  const handleLogin = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, insira um email.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Erro', 'Por favor, insira um email válido.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Erro', 'Por favor, insira uma password.');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
      console.log('Login bem-sucedido! Redirecionando...');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Erro no login:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      if (errorMessage.includes('Invalid login credentials')) {
        Alert.alert('Erro', 'Email ou password incorretos.');
      } else if (errorMessage.includes('Email not confirmed')) {
        Alert.alert(
          'Erro',
          'Por favor, confirme o seu email antes de fazer login.',
        );
      } else {
        Alert.alert('Erro', `Falha no login: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, validateEmail]);

  const animatedStepTransition = useCallback(
    (toStep: 'question' | 'login' | 'magicLink' | 'password' | 'nif') => {
      setStep(toStep);
    },
    [],
  );

  // Memoizar a função getCurrentOpacity
  const getCurrentOpacity = useCallback(() => {
    switch (step) {
      case 'question':
        return animatedValues.questionOpacity;
      case 'login':
        return animatedValues.loginOpacity;
      case 'magicLink':
        return animatedValues.magicLinkOpacity;
      case 'password':
        return animatedValues.passwordOpacity;
      case 'nif':
        return animatedValues.nifOpacity;
      default:
        return animatedValues.questionOpacity;
    }
  }, [step, animatedValues]);

  // Memoizar o estilo da animação comum
  const commonAnimatedStyle = useMemo(() => {
    const opacity = getCurrentOpacity();
    return {
      opacity,
      transform: [
        {
          translateY: opacity.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    };
  }, [getCurrentOpacity]);

  // Função para renderizar apenas o step atual
  const renderCurrentStep = useCallback(() => {
    switch (step) {
      case 'question':
      case 'question':
        return (
          <Animated.View style={[styles.stepContainer, commonAnimatedStyle]}>
            <Text style={styles.title}>
              O primeiro passo para mudar as suas finanças já foi dado
            </Text>
            <View style={styles.buttonGroup}>
              <View style={styles.optionWrapper}>
                <Text
                  style={[
                    styles.optionText1,
                    { marginBottom: 8, textAlign: 'center' },
                  ]}
                >
                  Já dei o segundo passo!
                </Text>
                <TouchableOpacity
                  onPress={() => animatedStepTransition('login')}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.optionGradient}
                  >
                    <Text style={styles.optionText}>Iniciar sessão</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.optionWrapper}>
                <Text
                  style={[
                    styles.optionText1,
                    { marginBottom: 8, textAlign: 'center' },
                  ]}
                >
                  Quero dar o segundo passo!
                </Text>
                <TouchableOpacity
                  onPress={() => animatedStepTransition('magicLink')}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.optionGradient}
                  >
                    <Text style={styles.optionText}>Registar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        );

      case 'magicLink':
        return (
          <Animated.View style={[styles.stepContainer, commonAnimatedStyle]}>
            <Text style={styles.title}>Qual é o seu email?</Text>
            <Text style={styles.subtitle}>
              Vamos criar a sua conta com este email.
            </Text>
            <TextInput
              placeholder="exemplo@email.com"
              placeholderTextColor="#999"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleMagicLink}
              style={[styles.buttonWrapper, isLoading && styles.buttonDisabled]}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Continuando...' : 'Continuar'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => animatedStepTransition('question')}
              style={styles.backButton}
              disabled={isLoading}
            >
              <Text style={styles.backText}>← Voltar</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'password':
        return (
          <Animated.View style={[styles.stepContainer, commonAnimatedStyle]}>
            <Text style={styles.title}>Escolha uma palavra-passe segura</Text>
            <Text style={styles.subtitle}>
              Deve ter pelo menos 8 caracteres, incluindo letras, números e
              símbolos.
            </Text>
            <Text
              style={[
                styles.subtitle,
                { fontSize: 14, color: '#666', marginBottom: 10 },
              ]}
            >
              Email: {email}
            </Text>
            <TextInput
              placeholder="********"
              placeholderTextColor="#999"
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => {
                if (!password.trim()) {
                  Alert.alert('Erro', 'Por favor, insira uma password.');
                } else if (password.length < 8) {
                  Alert.alert(
                    'Erro',
                    'A password deve ter pelo menos 8 caracteres.',
                  );
                } else {
                  animatedStepTransition('nif');
                }
              }}
              style={[styles.buttonWrapper, isLoading && styles.buttonDisabled]}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'A verificar...' : 'Continuar'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => animatedStepTransition('magicLink')}
              style={styles.backButton}
              disabled={isLoading}
            >
              <Text style={styles.backText}>← Voltar</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'nif':
        return (
          <Animated.View style={[styles.stepContainer, commonAnimatedStyle]}>
            <Text style={styles.title}>Quer adicionar o seu NIF?</Text>
            <Text style={styles.subtitle}>
              Com o NIF podemos ajudá-lo a maximizar as suas deduções fiscais.
              Pode sempre adicionar mais tarde nas definições.
            </Text>
            <Text
              style={[
                styles.subtitle,
                { fontSize: 14, color: '#666', marginBottom: 10 },
              ]}
            >
              Email: {email}
            </Text>
            <TextInput
              placeholder="123456789"
              placeholderTextColor="#999"
              style={styles.input}
              keyboardType="number-pad"
              maxLength={9}
              value={nif}
              onChangeText={setNif}
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              blurOnSubmit={true}
            />

            <TouchableOpacity
              onPress={() => handleSignUp(false)}
              style={[styles.buttonWrapper, isLoading && styles.buttonDisabled]}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Enviando...' : 'Continuar com NIF'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSignUp(true)}
              style={[styles.skipButton, isLoading && styles.buttonDisabled]}
              disabled={isLoading}
            >
              <Text style={styles.skipText}>Saltar por agora</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => animatedStepTransition('password')}
              style={styles.backButton}
              disabled={isLoading}
            >
              <Text style={styles.backText}>← Voltar</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'login':
        return (
          <Animated.View style={[styles.stepContainer, commonAnimatedStyle]}>
            <Text style={styles.title}>Iniciar Sessão</Text>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#999"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#999"
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleLogin}
              style={[styles.buttonWrapper, isLoading && styles.buttonDisabled]}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => animatedStepTransition('question')}
              style={styles.backButton}
              disabled={isLoading}
            >
              <Text style={styles.backText}>← Voltar</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      default:
        return null;
    }
  }, [
    step,
    commonAnimatedStyle,
    animatedStepTransition,
    handleMagicLink,
    handleSignUp,
    handleLogin,
    email,
    password,
    nif,
    isLoading,
  ]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.innerContainer}>
          <Image
            source={require('../assets/logo2.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {renderCurrentStep()}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
