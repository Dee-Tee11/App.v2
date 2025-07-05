import { useState } from 'react';
import { Alert } from 'react-native';
import {
  checkApiHealth,
  testApiWithSampleRequest,
} from '@/src/features/receipts/service/ocrService';

export const useApiCheck = () => {
  const [isCheckingApi, setIsCheckingApi] = useState(false);

  const quickApiCheck = async () => {
    setIsCheckingApi(true);

    try {
      console.log('🔍 Iniciando verificação da API...');
      const healthCheck = await checkApiHealth();

      if (healthCheck.isOnline) {
        Alert.alert(
          '✅ API Online',
          `Servidor funcionando normalmente!\n\nStatus: ${healthCheck.status}\nTempo de resposta: ${healthCheck.responseTime}ms`,
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert(
          '❌ API com Problemas',
          `Não foi possível conectar ao servidor.\n\nErro: ${
            healthCheck.error || 'Desconhecido'
          }\nTempo: ${healthCheck.responseTime}ms`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Teste Avançado',
              onPress: advancedApiTest,
            },
          ],
        );
      }
    } catch (error) {
      console.error('❌ Erro na verificação da API:', error);
      Alert.alert(
        '❌ Erro de Verificação',
        'Não foi possível verificar o estado da API.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsCheckingApi(false);
    }
  };

  const advancedApiTest = async () => {
    try {
      console.log('🧪 Executando teste avançado da API...');
      const testResult = await testApiWithSampleRequest();

      if (testResult.isOnline) {
        Alert.alert(
          '✅ Teste Avançado Bem-sucedido',
          `A API está funcionando corretamente!\n\nStatus: ${testResult.status}\nTempo de resposta: ${testResult.responseTime}ms\n\nPodes proceder com a digitalização dos recibos.`,
          [{ text: 'Excelente!' }],
        );
      } else {
        Alert.alert(
          '❌ Teste Avançado Falhado',
          `A API não está a responder adequadamente.\n\nStatus: ${
            testResult.status || 'N/A'
          }\nErro: ${testResult.error}\nTempo: ${
            testResult.responseTime
          }ms\n\nVerifica a tua conexão à internet.`,
          [{ text: 'Entendido' }],
        );
      }
    } catch (error) {
      console.error('❌ Erro no teste avançado:', error);
      Alert.alert(
        '❌ Erro no Teste Avançado',
        'Ocorreu um erro durante o teste da API.',
        [{ text: 'OK' }],
      );
    }
  };

  return {
    quickApiCheck,
    isCheckingApi,
  };
};
