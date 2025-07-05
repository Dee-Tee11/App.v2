import { StyleSheet } from 'react-native';
import { theme } from '@/src/theme';

export const styles = StyleSheet.create({
  // === CONTAINER PRINCIPAL ===
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // === HEADER ===
  header: {
    paddingBottom: 40,
    backgroundColor: theme.colors.primary,
  },
  headerTitle: {
    fontSize: theme.fontSizes['4xl'],
    fontWeight: '800',
    color: theme.colors.white,
    marginBottom: 8,
    paddingHorizontal: 24,
    paddingTop: 20,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.whiteOpacity85,
    paddingHorizontal: 24,
    fontWeight: '500',
    lineHeight: 22,
  },

  // === CONTENT ===
  content: {
    flex: 1,
    marginTop: -20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // === ESTATÍSTICAS - 3 CARTÕES HORIZONTAIS ===
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: 8,
    paddingVertical: 20,
    borderRadius: 20,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 100,
  },
  statContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
    lineHeight: 22,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.gray500,
    fontWeight: '600',
    lineHeight: 14,
    textAlign: 'center',
  },

  // === PESQUISA E FILTROS ===
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSizes.base,
    color: theme.colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },

  // === BOTÃO DE EXPORTAÇÃO ===
  exportButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  exportButtonDisabled: {
    opacity: 0.7,
  },
  exportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  exportButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.base,
    fontWeight: '700',
  },

  // === FILTROS ATIVOS ===
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#4338CA',
    fontWeight: '500',
    flex: 1,
  },
  clearFiltersLink: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '700',
  },

  // === MODAL DE FILTROS ===
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: '60%',
    paddingBottom: 40,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },

  // === SEÇÕES DE FILTRO ===
  filterSection: {
    marginVertical: 24,
  },
  filterSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },

  // === FILTROS DE DATA ===
  dateInputContainer: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dateInput: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: '#FFFFFF',
    fontWeight: '500',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // === CHECKBOX STYLES PARA FILTRO ATIVO ===
  checkboxActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderWidth: 2,
  },

  // === BOTÕES DO MODAL ===
  clearFiltersButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  clearFiltersButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  applyFiltersButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.white,
  },

  // === LISTA ===
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  emptyListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // === ESTADO VAZIO ===
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyDescription: {
    fontSize: theme.fontSizes.base,
    color: theme.colors.gray500,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },

  // === CATEGORIA ICON (caso necessário) ===
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 22,
    textAlign: 'center',
  },

  // === ESTILOS ADICIONAIS PARA FILTRO DE DATA ===
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 4,
  },
  quickFiltersContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  quickFiltersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  quickFilterButton: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickFilterText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
});
