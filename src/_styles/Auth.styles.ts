import { StyleSheet } from 'react-native';
// Update the path below to the correct relative path to your theme file
import { theme } from '../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    justifyContent: 'flex-start',
    paddingTop: 120,
  },
  innerContainer: {
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: theme.spacing.lg,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  absoluteStep: {
    position: 'absolute',
    top: 160,
  },
  tagline: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.lg,
    textAlign: 'center',
    marginBottom: theme.spacing.xxxl,
    fontWeight: theme.fontWeight.medium,
    lineHeight: 22,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    color: theme.colors.black,
    fontSize: theme.fontSizes.hero,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.gray500,
    fontSize: theme.fontSizes.md,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  input: {
    color: theme.colors.black,
    fontSize: theme.fontSizes.lg,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.gray300,
    width: '100%',
    paddingVertical: theme.spacing.md,
  },
  buttonWrapper: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  button: {
    borderRadius: theme.radius.base,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semiBold,
    fontSize: theme.fontSizes.lg,
  },
  skipButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.gray100,
    width: '100%',
    alignItems: 'center',
  },
  skipText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeight.medium,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: theme.spacing.xl, // ou usa justifyContent se 'gap' não for suportado nativamente
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  optionWrapper: {
    flex: 1,
    borderRadius: theme.radius.base,
    overflow: 'hidden',
  },
  optionGradient: {
    paddingVertical: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.base,
  },
  optionText1: {
    color: theme.colors.black,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeight.semiBold,
  },
  optionText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeight.semiBold,
  },
  backButton: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.sm,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.lg,
  },
});
