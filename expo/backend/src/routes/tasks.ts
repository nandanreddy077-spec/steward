import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { parseCommand, requiresApproval, generatePreview, getApprovalReasons, getSafetyExplanation } from '../services/ai';
import { supabase } from '../utils/db';
import { findEventByTime, createEvent, updateEvent, deleteEvent, listEvents, getCalendarClientWithRefresh } from '../services/calendar';
import { listMessages, sendEmail, draftEmail, getMessage, getGmailClientWithRefresh, draftEmailReply, extractEmailHeaders, getRecentEmailsForSelection, matchEmailFromCommand } from '../services/email';
import { getValidTokens } from '../utils/tokenRefresh';

const router = Router();

// Strict rate limiting for execute endpoint (10 requests per 15 minutes)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many task execution requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation utilities
const MIN_COMMAND_LENGTH = 3;
const MAX_COMMAND_LENGTH = 500;

function validateCommand(command: string): { isValid: boolean; error?: string } {
  if (!command || typeof command !== 'string') {
    return { isValid: false, error: 'Command is required' };
  }

  const trimmed = command.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Command cannot be empty' };
  }

  if (trimmed.length < MIN_COMMAND_LENGTH) {
    return { isValid: false, error: `Command must be at least ${MIN_COMMAND_LENGTH} characters` };
  }

  if (trimmed.length > MAX_COMMAND_LENGTH) {
    return { isValid: false, error: `Command must be less than ${MAX_COMMAND_LENGTH} characters` };
  }

  // Check for only whitespace
  if (!trimmed.replace(/\s+/g, '').length) {
    return { isValid: false, error: 'Command cannot be only spaces' };
  }

  return { isValid: true };
}

function sanitizeCommand(command: string): string {
  // Remove leading/trailing whitespace
  let sanitized = command.trim();

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Limit to max length
  if (sanitized.length > MAX_COMMAND_LENGTH) {
    sanitized = sanitized.substring(0, MAX_COMMAND_LENGTH);
  }

  return sanitized;
}

// Parse command and return intent
router.post('/parse', async (req, res) => {
  try {
    const { command, userId } = req.body;

    // Validate command
    const validation = validateCommand(command);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error || 'Invalid command' });
    }

    // Sanitize command
    const sanitized = sanitizeCommand(command);

    const intent = await parseCommand(sanitized);
    const needsApproval = requiresApproval(intent);
    
    // If it's an email reply action, draft the email first
    let preview = needsApproval ? generatePreview(intent, sanitized) : undefined;
    
    // Add approval reasons if approval is required
    if (needsApproval && preview) {
      preview.approvalReasons = getApprovalReasons(intent);
    }
    
    // Check if this is a reply action and we have userId (for email context)
    if (intent.domain === 'email' && (intent.action === 'send_email' || intent.action === 'reply_email') && userId) {
      const lowerCommand = sanitized.toLowerCase();
      const isReply = lowerCommand.includes('reply') || lowerCommand.includes('respond');
      
      if (isReply) {
        try {
          // Get user tokens to read email context
          const { data: user } = await supabase
            .from('users')
            .select('google_tokens')
            .eq('id', userId)
            .single();
          
          if (user?.google_tokens?.access_token) {
            // Get recent emails for matching/selection
            const recentEmails = await getRecentEmailsForSelection(user.google_tokens, 10);
            
            if (recentEmails.length > 0) {
              // Try to match email from command
              const matchResult = matchEmailFromCommand(recentEmails, sanitized);
              
              if (matchResult.matchedEmail && matchResult.confidence > 0.5) {
                // We found a confident match - draft the reply
                const draftedReply = await draftEmailReply(
                  user.google_tokens,
                  matchResult.matchedEmail.id,
                  sanitized
                );
                
                // Update preview with drafted email content
                preview = {
                  ...preview!,
                  emailPreview: {
                    to: draftedReply.to,
                    subject: draftedReply.subject,
                    body: draftedReply.body,
                  },
                  selectedEmailId: matchResult.matchedEmail.id,
                };
                
                // Update intent entities with drafted content
                intent.entities.to = draftedReply.to;
                intent.entities.subject = draftedReply.subject;
                intent.entities.body = draftedReply.body;
                intent.entities.emailId = matchResult.matchedEmail.id;
              } else {
                // No confident match - show recent emails for user to select
                preview = {
                  ...preview!,
                  recentEmails: recentEmails.slice(0, 5), // Show top 5 for selection
                };
              }
            }
          }
        } catch (error) {
          console.warn('Failed to get emails for reply, using basic preview:', error);
          // Continue with basic preview if fetching fails
        }
      }
    }
    
    // If email action and we have email content, update preview
    if (intent.domain === 'email' && intent.action === 'send_email' && intent.entities.to && intent.entities.subject) {
      preview = preview || generatePreview(intent, sanitized);
      preview.emailPreview = {
        to: intent.entities.to,
        subject: intent.entities.subject || 'No Subject',
        body: intent.entities.body || intent.entities.message || '',
      };
    }

    res.json({
      intent,
      requiresApproval: needsApproval,
      preview,
    });
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: 'Failed to parse command' });
  }
});

// Create task
router.post('/create', async (req, res) => {
  try {
    const { userId, command, intent, requiresApproval: needsApproval, preview } = req.body;

    // Validate required fields
    if (!userId || !command || !intent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate userId format (should be UUID)
    if (typeof userId !== 'string' || userId.length < 10) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Validate and sanitize command
    const validation = validateCommand(command);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error || 'Invalid command' });
    }

    const sanitized = sanitizeCommand(command);

    // Validate intent structure
    if (typeof intent !== 'object' || !intent.domain || !intent.action) {
      return res.status(400).json({ error: 'Invalid intent structure' });
    }

    const task = {
      user_id: userId,
      raw_command: sanitized,
      parsed_intent: intent,
      status: needsApproval ? 'pending_approval' : 'executing',
      requires_approval: needsApproval,
      preview: preview || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to create task' });
    }

    res.json({ task: data });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Execute task
router.post('/execute', async (req, res) => {
  try {
    const { taskId, userId } = req.body;

    // Get task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get user tokens
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('google_tokens')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If no Google tokens, return error (user needs to authenticate)
    if (!user?.google_tokens || !user.google_tokens.access_token) {
      await supabase
        .from('tasks')
        .update({
          status: 'failed',
          result: { 
            success: false, 
            message: 'Google OAuth required. Please log in with Google to execute tasks.' 
          },
          executed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);
      
      return res.status(401).json({
        success: false,
        error: 'Google OAuth required',
        result: { success: false, message: 'Please log in with Google to execute tasks.' },
      });
    }

    // Refresh tokens if needed before execution
    let validTokens = user.google_tokens;
    try {
      validTokens = await getValidTokens(userId, user.google_tokens);
    } catch (tokenError: any) {
      console.error('Token refresh failed:', tokenError);
      await supabase
        .from('tasks')
        .update({
          status: 'failed',
          result: { 
            success: false, 
            message: 'Failed to refresh Google tokens. Please reconnect your Google account in Settings.' 
          },
          executed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);
      
      return res.status(401).json({
        success: false,
        error: 'Token refresh failed',
        result: { success: false, message: 'Please reconnect your Google account.' },
      });
    }

    const intent = task.parsed_intent;
    let result: any = { success: false, message: '' };

    // Update task status to executing
    await supabase
      .from('tasks')
      .update({ status: 'executing', updated_at: new Date().toISOString() })
      .eq('id', taskId);

    // Execute based on domain and action
    try {
      if (intent.domain === 'calendar') {
        if (intent.action === 'reschedule_meeting') {
          // Find the event by time
          const events = await listEvents(validTokens, 50);
          const timeStr = intent.entities.time || '';
          const dateStr = intent.entities.date || '';
          
          // Find matching event (simplified - look for events around the time)
          let targetEvent = null;
          if (timeStr) {
            // Parse time (e.g., "3pm" -> 15:00)
            const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
            if (timeMatch) {
              let hour = parseInt(timeMatch[1]);
              const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
              const period = timeMatch[3]?.toLowerCase();
              
              if (period === 'pm' && hour !== 12) hour += 12;
              if (period === 'am' && hour === 12) hour = 0;
              
              // Find event matching time
              for (const event of events) {
                if (event.start?.dateTime) {
                  const eventDate = new Date(event.start.dateTime);
                  if (eventDate.getHours() === hour && Math.abs(eventDate.getMinutes() - minute) < 30) {
                    targetEvent = event;
                    break;
                  }
                }
              }
            }
          }
          
          if (targetEvent) {
            // Calculate new time (simplified - parse "tomorrow" or date)
            const newStart = new Date();
            if (dateStr === 'tomorrow') {
              newStart.setDate(newStart.getDate() + 1);
            }
            
            // Parse new time from entities or keep original time
            const newTimeStr = intent.entities.newTime || intent.entities.time || timeStr;
            if (newTimeStr) {
              const timeMatch = newTimeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
              if (timeMatch) {
                let hour = parseInt(timeMatch[1]);
                const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                const period = timeMatch[3]?.toLowerCase();
                
                if (period === 'pm' && hour !== 12) hour += 12;
                if (period === 'am' && hour === 12) hour = 0;
                
                newStart.setHours(hour, minute, 0);
              }
            } else {
              // Keep original time but move to new date
              if (targetEvent.start?.dateTime) {
                const originalDate = new Date(targetEvent.start.dateTime);
                newStart.setHours(originalDate.getHours(), originalDate.getMinutes(), 0);
              }
            }
            
            const newEnd = new Date(newStart);
            if (targetEvent.end?.dateTime && targetEvent.start?.dateTime) {
              const duration = new Date(targetEvent.end.dateTime).getTime() - new Date(targetEvent.start.dateTime).getTime();
              newEnd.setTime(newStart.getTime() + duration);
            } else {
              newEnd.setHours(newEnd.getHours() + 1);
            }
            
            await updateEvent(validTokens, targetEvent.id!, {
              start: newStart.toISOString(),
              end: newEnd.toISOString(),
            });
            
            result = { success: true, message: `Meeting rescheduled to ${newStart.toLocaleString()}` };
          } else {
            result = { success: false, message: 'Meeting not found at specified time' };
          }
        } else if (intent.action === 'cancel_meeting') {
          const events = await listEvents(validTokens, 50);
          const timeStr = intent.entities.time || '';
          
          let targetEvent = null;
          if (timeStr) {
            const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
            if (timeMatch) {
              let hour = parseInt(timeMatch[1]);
              const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
              const period = timeMatch[3]?.toLowerCase();
              
              if (period === 'pm' && hour !== 12) hour += 12;
              if (period === 'am' && hour === 12) hour = 0;
              
              for (const event of events) {
                if (event.start?.dateTime) {
                  const eventDate = new Date(event.start.dateTime);
                  if (eventDate.getHours() === hour && Math.abs(eventDate.getMinutes() - minute) < 30) {
                    targetEvent = event;
                    break;
                  }
                }
              }
            }
          }
          
          if (targetEvent && targetEvent.id) {
            await deleteEvent(validTokens, targetEvent.id);
            result = { success: true, message: 'Meeting cancelled successfully' };
          } else {
            result = { success: false, message: 'Meeting not found at specified time' };
          }
        } else if (intent.action === 'block_time' || intent.action === 'schedule_meeting') {
          // Calculate start and end times
          const startTime = new Date();
          const dateStr = intent.entities.date || '';
          
          if (dateStr === 'tomorrow') {
            startTime.setDate(startTime.getDate() + 1);
          } else if (dateStr === 'today') {
            // Keep today
          }
          
          const timeStr = intent.entities.time || '';
          if (timeStr) {
            const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
            if (timeMatch) {
              let hour = parseInt(timeMatch[1]);
              const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
              const period = timeMatch[3]?.toLowerCase();
              
              if (period === 'pm' && hour !== 12) hour += 12;
              if (period === 'am' && hour === 12) hour = 0;
              
              startTime.setHours(hour, minute, 0);
            }
          } else {
            // Default to current time + 1 hour if no time specified
            startTime.setHours(startTime.getHours() + 1);
            startTime.setMinutes(0, 0, 0);
          }
          
          const endTime = new Date(startTime);
          const duration = intent.entities.duration || 60; // Default 1 hour
          endTime.setMinutes(endTime.getMinutes() + duration);
          
          const summary = intent.entities.title || intent.entities.summary || 'Focus Time';
          const description = intent.entities.description || 'Blocked for deep work';
          
          await createEvent(
            validTokens,
            summary,
            startTime.toISOString(),
            endTime.toISOString(),
            description
          );
          
          result = { success: true, message: `${summary} scheduled for ${startTime.toLocaleString()}` };
        }
      } else if (intent.domain === 'email') {
        if (intent.action === 'summarize_inbox') {
          const messages = await listMessages(validTokens, 10);
          
          if (messages.length === 0) {
            result = { 
              success: true, 
              message: 'Your inbox is empty.',
              data: { messageCount: 0, summary: 'No emails found.' }
            };
          } else {
            // Get full message details for summarization (limit to 5 for performance)
            const messageDetails = await Promise.all(
              messages.slice(0, 5).map(msg => getMessage(validTokens, msg.id!))
            );
            
            // Extract subjects and senders
            const emailSummary = messageDetails.map(msg => {
              const headers = msg.payload?.headers || [];
              const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
              const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
              return { subject, from };
            });
            
            const summaryText = emailSummary.map(e => `• ${e.from}: ${e.subject}`).join('\n');
            
            result = { 
              success: true, 
              message: `Found ${messages.length} recent emails. Here are the latest:\n\n${summaryText}`,
              data: { 
                messageCount: messages.length,
                summary: summaryText,
                emails: emailSummary
              }
            };
          }
        } else if (intent.action === 'send_email' || intent.action === 'reply_email') {
          const to = intent.entities.to || intent.entities.recipient || '';
          const subject = intent.entities.subject || 'No Subject';
          const body = intent.entities.body || intent.entities.message || '';
          const emailId = intent.entities.emailId || task.preview?.selectedEmailId;
          
          if (to) {
            // Check if this is a reply
            const rawCommand = task.raw_command?.toLowerCase() || '';
            const isReply = rawCommand.includes('reply') || rawCommand.includes('respond');
            
            // Check if we have complete email content in entities (means it's been edited or explicitly provided)
            const hasCompleteContent = to && subject && body && 
                                     to.trim() !== '' && 
                                     subject.trim() !== '' && 
                                     body.trim() !== '';
            
            if (isReply && emailId && !hasCompleteContent) {
              // Reply to specific email - draft it (no complete content in entities)
              const draftedReply = await draftEmailReply(validTokens, emailId, task.raw_command);
              await sendEmail(validTokens, draftedReply.to, draftedReply.subject, draftedReply.body);
              result = { success: true, message: `Reply sent to ${draftedReply.to}` };
            } else if (isReply && emailId && hasCompleteContent) {
              // Reply with complete content in entities (user edited it) - use edited values
              await sendEmail(validTokens, to.trim(), subject.trim(), body.trim());
              result = { success: true, message: `Reply sent to ${to}` };
            } else if (isReply) {
              // No email ID - this shouldn't happen if preview worked correctly
              result = { success: false, message: 'Please select an email to reply to' };
            } else {
              // Regular send email - use entities content
              await sendEmail(validTokens, to.trim(), subject.trim(), body.trim());
              result = { success: true, message: `Email sent to ${to}` };
            }
          } else {
            result = { success: false, message: 'Recipient email address required' };
          }
        } else if (intent.action === 'draft_email') {
          // Separate action for drafting emails
          const to = intent.entities.to || intent.entities.recipient || '';
          const subject = intent.entities.subject || 'No Subject';
          const body = intent.entities.body || intent.entities.message || '';
          
          if (to) {
            await draftEmail(validTokens, to, subject, body);
            result = { success: true, message: `Email draft created for ${to}` };
          } else {
            result = { success: false, message: 'Recipient email address required' };
          }
        }
      } else if (intent.domain === 'booking') {
        // Mock booking for now
        result = { 
          success: true, 
          message: 'Booking service integration coming soon. This would book a restaurant/reservation.',
          data: { mock: true }
        };
      }

      // Generate safety explanation for successful tasks
      let safetyReasons: string[] = [];
      if (result.success) {
        safetyReasons = getSafetyExplanation(intent, result);
        result.safetyReasons = safetyReasons;
      }

      // Update task status
      await supabase
        .from('tasks')
        .update({
          status: result.success ? 'completed' : 'failed',
          result: result,
          executed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      res.json({ success: result.success, result });
    } catch (execError: any) {
      console.error('Execution error:', execError);
      
      await supabase
        .from('tasks')
        .update({
          status: 'failed',
          result: { success: false, message: execError.message || 'Execution failed' },
          executed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      res.status(500).json({ error: 'Execution failed', details: execError.message });
    }
  } catch (error) {
    console.error('Execute error:', error);
    res.status(500).json({ error: 'Failed to execute task' });
  }
});

// Apply strict rate limiting to execute endpoint
router.post('/execute', strictLimiter);

// Get user tasks
router.get('/user/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }

    res.json({ tasks: data || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Approve task
router.post('/approve', async (req, res) => {
  try {
    const { taskId, userId, selectedEmailId } = req.body;

    // Get current task
    const { data: currentTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !currentTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // If selectedEmailId is provided, update parsed_intent to include it
    let parsedIntent = currentTask.parsed_intent;
    if (selectedEmailId && parsedIntent) {
      parsedIntent = {
        ...parsedIntent,
        entities: {
          ...parsedIntent.entities,
          emailId: selectedEmailId,
        },
      };
    }

    // If this is a reply and we have selectedEmailId but no drafted email, draft it now
    if (selectedEmailId && parsedIntent.domain === 'email' && 
        (parsedIntent.action === 'send_email' || parsedIntent.action === 'reply_email')) {
      try {
        const { data: user } = await supabase
          .from('users')
          .select('google_tokens')
          .eq('id', userId)
          .single();

        if (user?.google_tokens?.access_token) {
          const draftedReply = await draftEmailReply(
            user.google_tokens,
            selectedEmailId,
            currentTask.raw_command
          );

          // Update preview with drafted email
          const updatedPreview = {
            ...(currentTask.preview || {}),
            emailPreview: {
              to: draftedReply.to,
              subject: draftedReply.subject,
              body: draftedReply.body,
            },
            selectedEmailId,
          };

          // Update task with drafted email and selected email ID
          const { data, error } = await supabase
            .from('tasks')
            .update({
              status: 'approved',
              parsed_intent: parsedIntent,
              preview: updatedPreview,
              updated_at: new Date().toISOString(),
            })
            .eq('id', taskId)
            .eq('user_id', userId)
            .select()
            .single();

          if (error) {
            return res.status(500).json({ error: 'Failed to approve task' });
          }

          return res.json({ task: data });
        }
      } catch (draftError) {
        console.error('Failed to draft email on approval:', draftError);
        // Continue with approval even if drafting fails
      }
    }

    // Update task status
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: 'approved',
        parsed_intent: parsedIntent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to approve task' });
    }

    res.json({ task: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve task' });
  }
});

// Reject task
router.post('/reject', async (req, res) => {
  try {
    const { taskId, userId } = req.body;

    const { data, error } = await supabase
      .from('tasks')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to reject task' });
    }

    res.json({ task: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject task' });
  }
});

export default router;

