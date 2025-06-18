import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Save, Calendar, DollarSign, Store, FileText } from 'lucide-react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

export interface EditableReceiptData {
  merchantName: string;
  totalValue: string;
  dateDetected: string;
  extractedText: string;
}

interface EditReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: EditableReceiptData) => void;
  initialData: EditableReceiptData;
  isLoading?: boolean;
}

export default function EditReceiptModal({
  visible,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}: EditReceiptModalProps) {
  const [formData, setFormData] = useState<EditableReceiptData>(initialData);
  const [errors, setErrors] = useState<Partial<EditableReceiptData>>({});

  useEffect(() => {
    if (visible) {
      setFormData(initialData);
      setErrors({});
    }
  }, [visible, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<EditableReceiptData> = {};

    if (!formData.merchantName.trim()) {
      newErrors.merchantName = 'Nome do estabelecimento é obrigatório';
    }

    if (!formData.totalValue.trim()) {
      newErrors.totalValue = 'Valor total é obrigatório';
    } else {
      const value = parseFloat(formData.totalValue.replace(',', '.'));
      if (isNaN(value) || value <= 0) {
        newErrors.totalValue = 'Valor deve ser um número positivo';
      }
    }

    if (!formData.dateDetected.trim()) {
      newErrors.dateDetected = 'Data é obrigatória';
    } else {
      // Validate date format (YYYY-MM-DD or DD/MM/YYYY)
      const dateRegex = /^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})$/;
      if (!dateRegex.test(formData.dateDetected)) {
        newErrors.dateDetected = 'Formato de data inválido (DD/MM/AAAA ou AAAA-MM-DD)';
      }
    }

    if (!formData.extractedText.trim()) {
      newErrors.extractedText = 'Texto extraído não pode estar vazio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters except comma and dot
    const cleaned = value.replace(/[^\d.,]/g, '');
    return cleaned;
  };

  const handleValueChange = (field: keyof EditableReceiptData, value: string) => {
    if (field === 'totalValue') {
      value = formatCurrency(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View
            entering={SlideInDown.springify().damping(15)}
            style={styles.modalContainer}
          >
            {/* Header */}
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Editar Recibo</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  disabled={isLoading}
                >
                  <X size={24} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Form Content */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View entering={FadeIn.delay(200)}>
                {/* Merchant Name */}
                <View style={styles.fieldContainer}>
                  <View style={styles.fieldHeader}>
                    <Store size={20} color="#8B5CF6" strokeWidth={2} />
                    <Text style={styles.fieldLabel}>Nome do Estabelecimento</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.textInput,
                      errors.merchantName && styles.inputError,
                    ]}
                    value={formData.merchantName}
                    onChangeText={(value) => handleValueChange('merchantName', value)}
                    placeholder="Ex: Continente, Pingo Doce..."
                    placeholderTextColor="#9CA3AF"
                    editable={!isLoading}
                  />
                  {errors.merchantName && (
                    <Text style={styles.errorText}>{errors.merchantName}</Text>
                  )}
                </View>

                {/* Total Value */}
                <View style={styles.fieldContainer}>
                  <View style={styles.fieldHeader}>
                    <DollarSign size={20} color="#10B981" strokeWidth={2} />
                    <Text style={styles.fieldLabel}>Valor Total</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.textInput,
                      errors.totalValue && styles.inputError,
                    ]}
                    value={formData.totalValue}
                    onChangeText={(value) => handleValueChange('totalValue', value)}
                    placeholder="Ex: 25,50 ou 25.50"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    editable={!isLoading}
                  />
                  {errors.totalValue && (
                    <Text style={styles.errorText}>{errors.totalValue}</Text>
                  )}
                </View>

                {/* Date */}
                <View style={styles.fieldContainer}>
                  <View style={styles.fieldHeader}>
                    <Calendar size={20} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.fieldLabel}>Data</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.textInput,
                      errors.dateDetected && styles.inputError,
                    ]}
                    value={formData.dateDetected}
                    onChangeText={(value) => handleValueChange('dateDetected', value)}
                    placeholder="DD/MM/AAAA ou AAAA-MM-DD"
                    placeholderTextColor="#9CA3AF"
                    editable={!isLoading}
                  />
                  {errors.dateDetected && (
                    <Text style={styles.errorText}>{errors.dateDetected}</Text>
                  )}
                </View>

                {/* Extracted Text */}
                <View style={styles.fieldContainer}>
                  <View style={styles.fieldHeader}>
                    <FileText size={20} color="#6366F1" strokeWidth={2} />
                    <Text style={styles.fieldLabel}>Texto Extraído</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.textAreaInput,
                      errors.extractedText && styles.inputError,
                    ]}
                    value={formData.extractedText}
                    onChangeText={(value) => handleValueChange('extractedText', value)}
                    placeholder="Texto completo do recibo..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    editable={!isLoading}
                  />
                  {errors.extractedText && (
                    <Text style={styles.errorText}>{errors.extractedText}</Text>
                  )}
                </View>
              </Animated.View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.cancelButton, isLoading && styles.buttonDisabled]}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  <Save size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.saveButtonText}>
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 10,
    letterSpacing: -0.2,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    fontWeight: '500',
  },
  textAreaInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    fontWeight: '500',
    minHeight: 120,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 34,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});