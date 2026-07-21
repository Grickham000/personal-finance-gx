import React from 'react';
import { 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { UserPlus, ArrowLeft, MailCheck } from 'lucide-react-native';
import { getStyles } from '../../styles/register.styles';
import { useRegister } from '../../hooks/useRegister';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    loading,
    registered,
    handleRegister,
  } = useRegister();

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primaryLight }]}>
              <UserPlus size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join us to take control of your financial future today.
            </Text>
          </View>

          {registered ? (
            <View style={[styles.glassCard, styles.successCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
              <View style={[styles.successIconContainer, { backgroundColor: colors.primaryLight }]}>
                <MailCheck size={48} color={colors.success} />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Verification Sent!</Text>
              <Text style={[styles.successText, { color: colors.textSecondary }]}>
                We've sent a verification email to <Text style={{ fontWeight: 'bold' }}>{email}</Text>. Please verify your email before logging in.
              </Text>
              
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: colors.primary, width: '100%' }]}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.buttonText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.glassCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Sign Up</Text>
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="yourname@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Password (Min. 6 chars)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity 
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={[styles.footerLink, { color: colors.primary }]}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
