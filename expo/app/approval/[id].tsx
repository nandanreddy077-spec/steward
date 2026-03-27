import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Check,
  AlertTriangle,
  Calendar,
  Mail,
  Utensils,
  ArrowRight,
  Edit,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/store/AppContext';
import Colors from '@/constants/colors';

const DOMAIN_ICONS = {
  calendar: Calendar,
  email: Mail,
  booking: Utensils,
};

const CHANGE_TYPE_COLORS = {
  create: Colors.dark.success,
  update: Colors.dark.info,
  delete: Colors.dark.error,
  send: Colors.dark.warning,
};

export default function ApprovalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks, approveTask, rejectTask } = useApp();
  const [isProcessing, setIsProcessing] = useState<'approve' | 'reject' | null>(null);
  const [slideAnim] = useState(new Animated.Value(0));
  const [editedEmail, setEditedEmail] = useState<{ to: string; subject: string; body: string } | null>(null);
  const [draftingEmail, setDraftingEmail] = useState(false);

  const task = tasks.find(t => t.id === id);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(task?.preview?.selectedEmailId || null);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      tension: 50,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  if (!task) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Task not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const DomainIcon = DOMAIN_ICONS[task.parsedIntent.domain];
  const preview = task.preview;

  // Update selectedEmailId when task changes
  useEffect(() => {
    if (task?.preview?.selectedEmailId) {
      setSelectedEmailId(task.preview.selectedEmailId);
    }
  }, [task?.preview?.selectedEmailId]);

  const handleEmailSelect = async (emailId: string) => {
    if (draftingEmail) return;
    
    setSelectedEmailId(emailId);
    setDraftingEmail(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Update task preview with selected email ID
      // The backend will use this when executing
      if (task) {
        const updatedPreview = {
          ...preview,
          selectedEmailId: emailId,
        };
        // Update task in context (this will be saved when approved)
        // For now, we'll pass it during approval
      }
    } catch (error) {
      console.error('Failed to select email:', error);
    } finally {
      setDraftingEmail(false);
    }
  };

  const handleApprove = async () => {
    // If email selection is required but not done, don't approve
    if (preview?.recentEmails && preview.recentEmails.length > 0 && !selectedEmailId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing('approve');
    
    // Update task with selected email ID before approving
    if (selectedEmailId && task) {
      // Update the task's parsed intent to include emailId
      const updatedIntent = {
        ...task.parsedIntent,
        entities: {
          ...task.parsedIntent.entities,
          emailId: selectedEmailId,
        },
      };
      // This will be handled by the backend when executing
    }
    
    // Update task with selected email ID before approving
    if (selectedEmailId) {
      // Update task's parsed intent to include emailId
      // This will be sent to backend in approve call
    }
    
    // Update task's parsed intent with selected email ID before approving
    if (selectedEmailId && task) {
      // Store selected email ID in task for backend to use
      task.parsedIntent.entities = {
        ...task.parsedIntent.entities,
        emailId: selectedEmailId,
      };
    }
    
    setTimeout(() => {
      approveTask(task.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }, 500);
  };

  const handleReject = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing('reject');
    
    setTimeout(() => {
      rejectTask(task.id);
      router.back();
    }, 500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Task</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.previewCard,
            {
              opacity: slideAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.previewHeader}>
            <View style={styles.domainBadge}>
              <DomainIcon size={18} color={Colors.dark.accent} />
              <Text style={styles.domainText}>
                {task.parsedIntent.domain.charAt(0).toUpperCase() + task.parsedIntent.domain.slice(1)}
              </Text>
            </View>
            <View style={styles.urgencyBadge}>
              <Text style={styles.urgencyText}>
                {task.parsedIntent.urgency.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.previewTitle}>
            {preview?.title || task.parsedIntent.description}
          </Text>

          <View style={styles.commandContainer}>
            <Text style={styles.commandLabel}>Original command</Text>
            <Text style={styles.commandText}>{task.rawCommand}</Text>
          </View>
        </Animated.View>

        {preview?.changes && preview.changes.length > 0 && (
          <Animated.View
            style={[
              styles.changesSection,
              {
                opacity: slideAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Changes to be made</Text>
            <View style={styles.changesList}>
              {preview.changes.map((change, index) => {
                const changeColor = CHANGE_TYPE_COLORS[change.type];
                return (
                  <View key={index} style={styles.changeItem}>
                    <View style={[styles.changeIcon, { backgroundColor: `${changeColor}20` }]}>
                      <ArrowRight size={14} color={changeColor} />
                    </View>
                    <View style={styles.changeContent}>
                      <View style={styles.changeHeader}>
                        <Text style={[styles.changeType, { color: changeColor }]}>
                          {change.type.toUpperCase()}
                        </Text>
                        <Text style={styles.changeEntity}>{change.entity}</Text>
                      </View>
                      <Text style={styles.changeDetail}>{change.detail}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {preview?.recentEmails && preview.recentEmails.length > 0 && !preview.emailPreview && (
          <Animated.View
            style={[
              styles.emailSelectionSection,
              {
                opacity: slideAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Select email to reply to</Text>
            <Text style={styles.selectionSubtitle}>
              We found multiple emails. Please select which one to reply to:
            </Text>
            
            <View style={styles.emailList}>
              {preview.recentEmails.map((email) => (
                <TouchableOpacity
                  key={email.id}
                  style={[
                    styles.emailItem,
                    selectedEmailId === email.id && styles.emailItemSelected,
                  ]}
                  onPress={() => handleEmailSelect(email.id)}
                  activeOpacity={0.7}
                  disabled={draftingEmail}
                >
                  <View style={styles.emailItemContent}>
                    <View style={styles.emailItemHeader}>
                      <Text style={styles.emailItemFrom} numberOfLines={1}>
                        {email.from}
                      </Text>
                      {selectedEmailId === email.id && (
                        <Check size={16} color={Colors.dark.success} />
                      )}
                    </View>
                    <Text style={styles.emailItemSubject} numberOfLines={1}>
                      {email.subject}
                    </Text>
                    {email.snippet && (
                      <Text style={styles.emailItemSnippet} numberOfLines={2}>
                        {email.snippet}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            {draftingEmail && (
              <View style={styles.draftingIndicator}>
                <Text style={styles.draftingText}>Drafting reply...</Text>
              </View>
            )}
          </Animated.View>
        )}

        {preview?.emailPreview && (
          <Animated.View
            style={[
              styles.emailPreviewSection,
              {
                opacity: slideAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.emailPreviewHeader}>
              <Text style={styles.sectionTitle}>Email Preview</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/edit-email/${task.id}` as any);
                }}
                activeOpacity={0.7}
              >
                <Edit size={16} color={Colors.dark.accent} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.emailPreviewCard}>
              <View style={styles.emailField}>
                <Text style={styles.emailLabel}>To:</Text>
                <Text style={styles.emailValue}>{preview.emailPreview.to}</Text>
              </View>
              
              <View style={styles.emailField}>
                <Text style={styles.emailLabel}>Subject:</Text>
                <Text style={styles.emailValue}>{preview.emailPreview.subject}</Text>
              </View>
              
              <View style={[styles.emailField, styles.emailBodyField]}>
                <Text style={styles.emailLabel}>Body:</Text>
                <Text style={styles.emailBodyText}>{preview.emailPreview.body}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {preview?.approvalReasons && preview.approvalReasons.length > 0 && (
          <Animated.View
            style={[
              styles.approvalReasonsSection,
              {
                opacity: slideAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Why approval is required</Text>
            <View style={styles.reasonsList}>
              {preview.approvalReasons.map((reason, index) => (
                <View key={index} style={styles.reasonItem}>
                  <View style={styles.reasonBullet} />
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {preview?.warnings && preview.warnings.length > 0 && (
          <Animated.View
            style={[
              styles.warningsSection,
              {
                opacity: slideAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {preview.warnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <AlertTriangle size={16} color={Colors.dark.warning} />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={handleReject}
          disabled={isProcessing !== null}
          activeOpacity={0.8}
        >
          <X size={20} color={Colors.dark.error} />
          <Text style={styles.rejectButtonText}>
            {isProcessing === 'reject' ? 'Cancelling...' : 'Reject'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.approveButton,
            (preview?.recentEmails && preview.recentEmails.length > 0 && !selectedEmailId) && styles.approveButtonDisabled,
          ]}
          onPress={handleApprove}
          disabled={isProcessing !== null || (preview?.recentEmails && preview.recentEmails.length > 0 && !selectedEmailId)}
          activeOpacity={0.8}
        >
          <Check size={20} color={Colors.dark.background} />
          <Text style={styles.approveButtonText}>
            {isProcessing === 'approve' ? 'Approving...' : 
             (preview?.recentEmails && preview.recentEmails.length > 0 && !selectedEmailId) ? 'Select Email First' : 
             'Approve'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingVertical: 12,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  previewCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  domainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dark.accentMuted,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  domainText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  urgencyBadge: {
    backgroundColor: Colors.dark.surfaceElevated,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.dark.textSecondary,
    letterSpacing: 0.5,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    lineHeight: 28,
    marginBottom: 16,
  },
  commandContainer: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 10,
    padding: 14,
  },
  commandLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  commandText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontStyle: 'italic',
  },
  changesSection: {},
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  changesList: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    overflow: 'hidden',
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.borderLight,
  },
  changeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  changeContent: {
    flex: 1,
  },
  changeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  changeType: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  changeEntity: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  changeDetail: {
    fontSize: 15,
    color: Colors.dark.text,
    lineHeight: 20,
  },
  warningsSection: {
    gap: 10,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.dark.warningMuted,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.2)',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.borderLight,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  rejectButton: {
    backgroundColor: Colors.dark.errorMuted,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.error,
  },
  approveButton: {
    backgroundColor: Colors.dark.success,
  },
  approveButtonDisabled: {
    backgroundColor: Colors.dark.surfaceElevated,
    opacity: 0.5,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.background,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    color: Colors.dark.textSecondary,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Colors.dark.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  emailPreviewSection: {
    gap: 12,
  },
  emailPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.accentMuted,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  emailPreviewCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    padding: 16,
    gap: 12,
  },
  emailField: {
    gap: 4,
  },
  emailBodyField: {
    marginTop: 4,
  },
  emailLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emailValue: {
    fontSize: 15,
    color: Colors.dark.text,
    fontWeight: '500' as const,
  },
  emailBodyText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
  emailSelectionSection: {
    gap: 12,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  emailList: {
    gap: 8,
  },
  emailItem: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    padding: 16,
  },
  emailItemSelected: {
    borderColor: Colors.dark.success,
    borderWidth: 2,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  emailItemContent: {
    gap: 6,
  },
  emailItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emailItemFrom: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    flex: 1,
  },
  emailItemSubject: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  emailItemSnippet: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    lineHeight: 18,
    marginTop: 4,
  },
  draftingIndicator: {
    padding: 12,
    backgroundColor: Colors.dark.accentMuted,
    borderRadius: 8,
    alignItems: 'center',
  },
  draftingText: {
    fontSize: 14,
    color: Colors.dark.accent,
    fontWeight: '500' as const,
  },
  approvalReasonsSection: {
    gap: 12,
  },
  reasonsList: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    padding: 16,
    gap: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  reasonBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.accent,
    marginTop: 6,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
});
