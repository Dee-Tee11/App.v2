import React from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FileText,
  DollarSign,
  Calendar,
  Store,
  Edit3,
  Check,
  X,
  ZoomIn,
  Receipt,
  Percent,
} from 'lucide-react-native';
import Animated from 'react-native-reanimated';
import { styles } from '@/src/features/receipts/styles/ScannerScreen.styles';

interface Props {
  imageUrl: string;
  extractedText: string;
  merchantName: string;
  setMerchantName: (text: string) => void;
  totalValue: string;
  setTotalValue: (text: string) => void;
  date: string;
  setDate: (text: string) => void;
  category: string;
  setCategory: (text: string) => void;
  isFatura: boolean;
  setIsFatura: (value: boolean) => void;
  isConfirming: boolean;
  onConfirm: () => void;
  ivaDedutivel: boolean;
  setIvaDedutivel: (value: boolean) => void;
  valorTotalIVA: string | null;
  setValorTotalIVA: React.Dispatch<React.SetStateAction<string | null>>;
  contarIVA: boolean;
  setContarIVA: (value: boolean) => void;
}

export const ResultCard: React.FC<Props> = ({
  imageUrl,
  extractedText,
  merchantName,
  setMerchantName,
  totalValue,
  setTotalValue,
  date,
  setDate,
  category,
  setCategory,
  isFatura,
  setIsFatura,
  isConfirming,
  onConfirm,
  ivaDedutivel,
  setIvaDedutivel,
  valorTotalIVA,
  setValorTotalIVA,
  contarIVA,
  setContarIVA,
}) => {
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [tempDate, setTempDate] = React.useState<Date>(new Date());
  const [showImageModal, setShowImageModal] = React.useState(false);

  // Helpers e handlers
  const handleIsFacturaChange = React.useCallback(
    (value: boolean) => {
      setIsFatura(value);
      if (!value) {
        setIvaDedutivel(false);
        setValorTotalIVA(null);
        setContarIVA(false);
      }
    },
    [setIsFatura, setIvaDedutivel, setValorTotalIVA, setContarIVA],
  );

  const handleContarIVAChange = React.useCallback(
    (value: boolean) => {
      setContarIVA(value);
    },
    [setContarIVA],
  );

  const handleDateChange = (_: any, selectedDate?: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (selectedDate) {
        const formatted = selectedDate.toLocaleDateString('pt-PT');
        setDate(formatted);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirmDate = () => {
    const formatted = tempDate.toLocaleDateString('pt-PT');
    setDate(formatted);
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date();
  };

  const openDatePicker = () => {
    setTempDate(parseDate(date));
    setShowDatePicker(true);
  };

  const openImageModal = () => setShowImageModal(true);
  const closeImageModal = () => setShowImageModal(false);

  const isPdf = imageUrl.toLowerCase().endsWith('.pdf');

  return (
    <Animated.View style={styles.resultContainer}>
      <Text style={styles.sectionTitle}>Confirmar Dados</Text>
      <View style={styles.resultCard}>
        {/* Imagem ou PDF com overlay de zoom */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={openImageModal}
          activeOpacity={0.8}
        >
          {isPdf ? (
            <View style={styles.pdfPreviewContainer}>
              <FileText size={50} color="#8B5CF6" />
              <Text style={styles.pdfPreviewText}>Pré-visualizar PDF</Text>
            </View>
          ) : (
            <Image source={{ uri: imageUrl }} style={styles.resultImage} />
          )}
          <View style={styles.zoomOverlay}>
            <ZoomIn size={20} color="#FFFFFF" strokeWidth={2} />
          </View>
        </TouchableOpacity>

        <View style={styles.resultInfo}>
          <View style={styles.editableSection}>
            {/* ESTABELECIMENTO */}
            <View style={styles.editableField}>
              <View style={styles.fieldHeader}>
                <Store size={18} color="#8B5CF6" strokeWidth={2} />
                <Text style={styles.fieldLabel}>Estabelecimento</Text>
                <Edit3 size={14} color="#6B7280" strokeWidth={2} />
              </View>
              <TextInput
                style={styles.editableInput}
                value={merchantName}
                onChangeText={setMerchantName}
                placeholder="Nome do estabelecimento"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {/* VALOR TOTAL */}
            <View style={styles.editableField}>
              <View style={styles.fieldHeader}>
                <DollarSign size={18} color="#10B981" strokeWidth={2} />
                <Text style={styles.fieldLabel}>Valor Total</Text>
                <Edit3 size={14} color="#6B7280" strokeWidth={2} />
              </View>
              <TextInput
                style={styles.editableInput}
                value={totalValue}
                onChangeText={setTotalValue}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
            </View>
            {/* DATA */}
            <View style={styles.editableField}>
              <View style={styles.fieldHeader}>
                <Calendar size={18} color="#6B7280" strokeWidth={2} />
                <Text style={styles.fieldLabel}>Data</Text>
                <Edit3 size={14} color="#6B7280" strokeWidth={2} />
              </View>
              <TouchableOpacity onPress={openDatePicker}>
                <Text style={styles.editableInput}>{date || 'DD/MM/AAAA'}</Text>
              </TouchableOpacity>
            </View>
            {/* CATEGORIA */}
            <View style={styles.editableField}>
              <View style={styles.fieldHeader}>
                <Store size={18} color="#F59E0B" strokeWidth={2} />
                <Text style={styles.fieldLabel}>Categoria</Text>
                <Edit3 size={14} color="#6B7280" strokeWidth={2} />
              </View>
              <TextInput
                style={styles.editableInput}
                value={category}
                onChangeText={setCategory}
                placeholder="Ex: Alimentação, Saúde..."
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {/* TIPO DE DOCUMENTO */}
            <View style={styles.editableField}>
              <View style={styles.fieldHeader}>
                <Receipt size={18} color="#DC2626" strokeWidth={2} />
                <Text style={styles.fieldLabel}>Tipo de Documento</Text>
              </View>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleIsFacturaChange(!isFatura)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.checkbox, isFatura && styles.checkboxChecked]}
                >
                  {isFatura && (
                    <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  É uma fatura (permite dedução IVA)
                </Text>
              </TouchableOpacity>
            </View>
            {/* CONTROLE DE IVA */}
            {isFatura && (
              <View style={styles.editableField}>
                <View style={styles.fieldHeader}>
                  <Percent size={18} color="#059669" strokeWidth={2} />
                  <Text style={styles.fieldLabel}>Controle de IVA</Text>
                </View>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => handleContarIVAChange(!contarIVA)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      contarIVA && styles.checkboxChecked,
                    ]}
                  >
                    {contarIVA && (
                      <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Quero contar o IVA deste documento
                  </Text>
                </TouchableOpacity>
                {contarIVA && (
                  <View style={styles.ivaInfoContainer}>
                    <Text style={styles.ivaInfoSubtext}>
                      ℹ️ O IVA deste documento será incluído nos seus cálculos
                      de dedução
                    </Text>
                  </View>
                )}
              </View>
            )}
            {/* INFORMAÇÕES DE IVA */}
            {isFatura && contarIVA && (
              <View style={styles.editableField}>
                <View style={styles.fieldHeader}>
                  <Percent size={18} color="#059669" strokeWidth={2} />
                  <Text style={styles.fieldLabel}>Informações de IVA</Text>
                </View>
                <View style={styles.ivaInfoContainer}>
                  {ivaDedutivel ? (
                    <>
                      <Text style={styles.ivaInfoText}>✅ IVA Dedutível</Text>
                      {valorTotalIVA && (
                        <Text style={styles.ivaInfoSubtext}>
                          Valor de IVA: €{valorTotalIVA}
                        </Text>
                      )}
                      <Text style={styles.ivaInfoSubtext}>
                        Este documento permite dedução de IVA
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.ivaInfoTextNonDeductible}>
                        ❌ IVA Não Dedutível
                      </Text>
                      <Text style={styles.ivaInfoSubtext}>
                        Esta categoria não permite dedução de IVA
                      </Text>
                    </>
                  )}
                </View>
              </View>
            )}
            {/* EDITAR VALOR DE IVA */}
            {isFatura && contarIVA && ivaDedutivel && (
              <View style={styles.editableField}>
                <View style={styles.fieldHeader}>
                  <DollarSign size={18} color="#059669" strokeWidth={2} />
                  <Text style={styles.fieldLabel}>Valor do IVA</Text>
                  <Edit3 size={14} color="#6B7280" strokeWidth={2} />
                </View>
                <TextInput
                  style={styles.editableInput}
                  value={valorTotalIVA || ''}
                  onChangeText={setValorTotalIVA}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.ivaInfoSubtext}>
                  💡 Pode editar o valor do IVA se necessário
                </Text>
              </View>
            )}
          </View>
          {/* TEXTO EXTRAÍDO */}
          <View style={styles.textContainer}>
            <View style={styles.textHeader}>
              <FileText size={18} color="#6B7280" strokeWidth={2} />
              <Text style={styles.textTitle}>Texto Extraído</Text>
            </View>
            <ScrollView style={styles.textScrollView} nestedScrollEnabled>
              <Text style={styles.extractedText}>
                {extractedText || 'Nenhum texto extraído'}
              </Text>
            </ScrollView>
          </View>
          {/* BOTÃO CONFIRMAR */}
          <View style={styles.confirmButtonWrapper}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
              disabled={isConfirming}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.confirmGradient}
              >
                <Check size={24} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.confirmButtonText}>
                  {isConfirming ? 'Confirmando...' : 'Confirmar Recibo'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* MODAL DE IMAGEM/PDF */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.imageModalContainer}>
          <StatusBar
            backgroundColor="rgba(0, 0, 0, 0.9)"
            barStyle="light-content"
          />
          <TouchableOpacity
            style={styles.imageModalBackground}
            activeOpacity={1}
            onPress={closeImageModal}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeImageModal}
            activeOpacity={0.8}
          >
            <View style={styles.closeButtonBackground}>
              <X size={24} color="#FFFFFF" strokeWidth={2} />
            </View>
          </TouchableOpacity>
          <ScrollView
            style={styles.imageModalScrollView}
            contentContainerStyle={styles.imageModalContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {isPdf ? (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                }}
              >
                <FileText size={50} color="#8B5CF6" />
                <Text style={styles.pdfPreviewText}>Visualizar PDF</Text>
                <TouchableOpacity
                  style={[styles.confirmButton, { marginTop: 20 }]}
                  onPress={() => WebBrowser.openBrowserAsync(imageUrl)}
                >
                  <Text style={styles.confirmButtonText}>Abrir PDF</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={styles.expandedImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomIndicatorText}>
              Toque para fechar • Pinça para ampliar
            </Text>
          </View>
        </View>
      </Modal>
      {/* MODAL DATEPICKER IOS */}
      {Platform.OS === 'ios' && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={handleCancelDate}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={handleCancelDate}
            />
            <View
              style={{
                backgroundColor: 'white',
                paddingBottom: 34,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                }}
              >
                <TouchableOpacity onPress={handleCancelDate}>
                  <Text style={{ color: '#007AFF', fontSize: 17 }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmDate}>
                  <Text
                    style={{
                      color: '#007AFF',
                      fontSize: 17,
                      fontWeight: '600',
                    }}
                  >
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                style={{
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  locale="pt-PT"
                  themeVariant="light"
                  textColor="#000"
                  style={{
                    backgroundColor: 'white',
                    width: '100%',
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
      {/* DATEPICKER ANDROID */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={parseDate(date)}
          mode="date"
          display="default"
          onChange={handleDateChange}
          locale="pt-PT"
        />
      )}
    </Animated.View>
  );
};
