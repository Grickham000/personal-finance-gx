import React, { useState } from 'react';
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
import { Mail, ArrowLeft } from 'lucide-react-native';
import { getStyles } from '../../styles/login.styles';
import { sendResetPasswordEmail } from '../../services/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address.');
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await sendResetPasswordEmail(email.trim());
      setSuccess('A password reset link has been sent to your email.');
      setEmail('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No user found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primaryLight }]}>
              <Mail size={42} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your email address to receive a link to reset your account password.
            </Text>
          </View>

          <View style={[styles.glassCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Forgot Password?</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? (
              <Text style={{
                color: colors.success,
                fontSize: 14,
                fontWeight: '600',
                textAlign: 'center',
                marginBottom: 16
              }}>{success}</Text>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="email@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} 
                onPress={() => router.push('/(auth)/login')}
              >
                <ArrowLeft size={16} color={colors.primary} />
                <Text style={[styles.footerLink, { color: colors.primary }]}>Back to Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
