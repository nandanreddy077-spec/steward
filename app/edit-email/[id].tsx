import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Save } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/store/AppContext';
import Colors from '@/constants/colors';

export default function EditEmailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks, updateTaskPreview } = useApp();
  
  const task = tasks.find(t => t.id === id);
  const emailPreview = task?.preview?.emailPreview;
  
  const [to, setTo] = useState(emailPreview?.to || '');
  const [subject, setSubject] = useState(emailPreview?.subject || '');
  const [body, setBody] = useState(emailPreview?.body || '');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (emailPreview) {
      setTo(emailPreview.to || '');
      setSubject(emailPreview.subject || '');
      setBody(emailPreview.body || '');
    }
  }, [emailPreview]);

  useEffect(() => {
    const changed = 
      to !== (emailPreview?.to || '') ||
      subject !== (emailPreview?.subject || '') ||
      body !== (emailPreview?.body || '');
    setHasChanges(changed);
  }, [to, subject, body, emailPreview]);

  const handleSave = () => {
    if (!task) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Update task preview with edited email content
    const updatedPreview = {
      ...task.preview,
      emailPreview: {
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
      },
    };
    
    updateTaskPreview(task.id, updatedPreview);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (!task || !emailPreview) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <X size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Email</Text>
          <View style={styles.closeButton} />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Email preview not found</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <X size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Email</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          disabled={!hasChanges}
          activeOpacity={0.7}
        >
          <Save size={20} color={hasChanges ? Colors.dark.success : Colors.dark.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>To</Text>
          <TextInput
            style={styles.input}
            value={to}
            onChangeText={setTo}
            placeholder="Recipient email address"
            placeholderTextColor={Colors.dark.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Email subject"
            placeholderTextColor={Colors.dark.textMuted}
            autoCapitalize="sentences"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Body</Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            value={body}
            onChangeText={setBody}
            placeholder="Email body"
            placeholderTextColor={Colors.dark.textMuted}
            multiline
            textAlignVertical="top"
            autoCapitalize="sentences"
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { marginRight: 12 }]}
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButtonFooter, !hasChanges && styles.saveButtonFooterDisabled]}
          onPress={handleSave}
          disabled={!hasChanges}
          activeOpacity={0.8}
        >
          <Check size={20} color={hasChanges ? Colors.dark.background : Colors.dark.textMuted} />
          <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.borderLight,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  saveButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  bodyInput: {
    minHeight: 200,
    paddingTop: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.borderLight,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  saveButtonFooter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.success,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonFooterDisabled: {
    backgroundColor: Colors.dark.surfaceElevated,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.background,
  },
  saveButtonTextDisabled: {
    color: Colors.dark.textMuted,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
});

