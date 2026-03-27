import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Send, Calendar, Mail, Utensils, Sparkles, AlertCircle, Eye } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/store/AppContext';
import Colors from '@/constants/colors';
import { validateCommand, sanitizeCommand } from '@/utils/validation';

const QUICK_COMMANDS = [
  { icon: Calendar, label: 'Block focus time tomorrow morning', domain: 'calendar' },
  { icon: Mail, label: 'Summarize my inbox', domain: 'email' },
  { icon: Calendar, label: 'Reschedule my 3pm to tomorrow', domain: 'calendar' },
  { icon: Utensils, label: 'Book dinner for 2 at 8pm', domain: 'booking' },
];

export default function CommandScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createTask, pendingTasks } = useApp();
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [dryRunMode, setDryRunMode] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const successAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleSubmit = async () => {
    if (isProcessing) return;

    // Validate command
    const sanitized = sanitizeCommand(command);
    const validation = validateCommand(sanitized);
    
    setHasAttemptedSubmit(true);
    
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid command');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setValidationError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    setIsProcessing(true);

    setTimeout(() => {
      // In dry run mode, create task but it will be marked as preview-only
      createTask(sanitized);
      setIsProcessing(false);
      
      // Don't clear command in dry run mode so user can adjust
      if (!dryRunMode) {
        setCommand('');
      }
      setHasAttemptedSubmit(false);
      setValidationError(null);

      setShowSuccess(true);
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccess(false);
        const newPendingTask = pendingTasks[0];
        if (newPendingTask) {
          router.push(`/approval/${newPendingTask.id}`);
        }
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 800);
  };

  const handleCommandChange = (text: string) => {
    setCommand(text);
    // Clear validation error when user starts typing
    if (validationError && hasAttemptedSubmit) {
      const validation = validateCommand(sanitizeCommand(text));
      if (validation.isValid) {
        setValidationError(null);
      }
    }
  };

  const handleQuickCommand = (commandText: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCommand(commandText);
    inputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Sparkles size={32} color={Colors.dark.accent} />
          </Animated.View>
          <Text style={styles.title}>What do you need done?</Text>
          <Text style={styles.subtitle}>
            Ask Steward to handle it. I'll show you what I'll do before taking action.
          </Text>
        </View>

        <View style={styles.inputSection}>
          <View style={[
            styles.inputContainer,
            validationError && hasAttemptedSubmit && styles.inputContainerError,
          ]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Cancel my 3pm meeting and apologize to attendees"
              placeholderTextColor={Colors.dark.textMuted}
              value={command}
              onChangeText={handleCommandChange}
              multiline
              maxLength={500}
              editable={!isProcessing}
              returnKeyType="default"
            />
          </View>

          {validationError && hasAttemptedSubmit && (
            <View style={styles.errorContainer}>
              <AlertCircle size={14} color={Colors.dark.error} />
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          )}

          <View style={styles.inputFooter}>
            <TouchableOpacity
              style={styles.dryRunToggle}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDryRunMode(!dryRunMode);
              }}
              activeOpacity={0.7}
            >
              <Eye 
                size={16} 
                color={dryRunMode ? Colors.dark.accent : Colors.dark.textMuted} 
              />
              <Text style={[
                styles.dryRunText,
                dryRunMode && styles.dryRunTextActive
              ]}>
                Preview only
              </Text>
            </TouchableOpacity>
            <Text style={styles.charCount}>
              {command.length}/500
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!command.trim() || isProcessing || (validationError && hasAttemptedSubmit)) && styles.submitButtonDisabled,
              dryRunMode && styles.submitButtonDryRun,
            ]}
            onPress={handleSubmit}
            disabled={!command.trim() || isProcessing || (validationError !== null && hasAttemptedSubmit)}
            activeOpacity={0.8}
          >
            {dryRunMode ? (
              <Eye
                size={20}
                color={command.trim() && !isProcessing && !validationError ? Colors.dark.background : Colors.dark.textMuted}
              />
            ) : (
              <Send
                size={20}
                color={command.trim() && !isProcessing && !validationError ? Colors.dark.background : Colors.dark.textMuted}
              />
            )}
            <Text
              style={[
                styles.submitButtonText,
                (!command.trim() || isProcessing || (validationError && hasAttemptedSubmit)) && styles.submitButtonTextDisabled,
              ]}
            >
              {isProcessing ? 'Processing...' : dryRunMode ? 'Preview Only' : 'Execute'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>Quick commands</Text>
          <View style={styles.quickCommands}>
            {QUICK_COMMANDS.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.quickCommand}
                  onPress={() => handleQuickCommand(item.label)}
                  activeOpacity={0.7}
                >
                  <Icon size={16} color={Colors.dark.accent} />
                  <Text style={styles.quickCommandText}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.capabilitiesSection}>
          <Text style={styles.capabilitiesTitle}>I can help with</Text>
          <View style={styles.capabilities}>
            <View style={styles.capabilityItem}>
              <View style={[styles.capabilityIcon, { backgroundColor: Colors.dark.infoMuted }]}>
                <Calendar size={16} color={Colors.dark.info} />
              </View>
              <View style={styles.capabilityContent}>
                <Text style={styles.capabilityLabel}>Calendar</Text>
                <Text style={styles.capabilityDesc}>
                  Schedule, reschedule, cancel meetings
                </Text>
              </View>
            </View>
            <View style={styles.capabilityItem}>
              <View style={[styles.capabilityIcon, { backgroundColor: Colors.dark.successMuted }]}>
                <Mail size={16} color={Colors.dark.success} />
              </View>
              <View style={styles.capabilityContent}>
                <Text style={styles.capabilityLabel}>Email</Text>
                <Text style={styles.capabilityDesc}>
                  Summarize, draft replies, flag urgent
                </Text>
              </View>
            </View>
            <View style={styles.capabilityItem}>
              <View style={[styles.capabilityIcon, { backgroundColor: Colors.dark.warningMuted }]}>
                <Utensils size={16} color={Colors.dark.warning} />
              </View>
              <View style={styles.capabilityContent}>
                <Text style={styles.capabilityLabel}>Bookings</Text>
                <Text style={styles.capabilityDesc}>
                  Restaurants, travel, services
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {showSuccess && (
        <Animated.View
          style={[
            styles.successOverlay,
            {
              opacity: successAnim,
              transform: [
                {
                  scale: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.successContent}>
            <View style={styles.successIcon}>
              <Sparkles size={28} color={Colors.dark.accent} />
            </View>
            <Text style={styles.successText}>Task created</Text>
          </View>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.dark.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 12,
  },
  inputContainerError: {
    borderColor: Colors.dark.error,
    borderWidth: 1.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 13,
    color: Colors.dark.error,
    flex: 1,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dryRunToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dryRunText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontWeight: '500' as const,
  },
  dryRunTextActive: {
    color: Colors.dark.accent,
  },
  charCount: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  input: {
    fontSize: 16,
    color: Colors.dark.text,
    padding: 18,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.dark.surfaceElevated,
  },
  submitButtonDryRun: {
    backgroundColor: Colors.dark.info,
  },
  submitButtonDryRun: {
    backgroundColor: Colors.dark.info,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.background,
  },
  submitButtonTextDisabled: {
    color: Colors.dark.textMuted,
  },
  quickSection: {
    marginBottom: 32,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  quickCommands: {
    gap: 8,
  },
  quickCommand: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  quickCommandText: {
    fontSize: 14,
    color: Colors.dark.text,
    flex: 1,
  },
  capabilitiesSection: {},
  capabilitiesTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  capabilities: {
    gap: 12,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  capabilityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capabilityContent: {
    flex: 1,
  },
  capabilityLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  capabilityDesc: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 12, 14, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContent: {
    alignItems: 'center',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
});
