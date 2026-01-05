import { Router, Request, Response } from 'express';
import { parseCommand, requiresApproval, generatePreview } from '../services/ai';
import { supabase } from '../utils/db';
import { findEventByTime, createEvent, updateEvent, deleteEvent, listEvents } from '../services/calendar';
import { listMessages, sendEmail, draftEmail } from '../services/email';

const router = Router();

// Parse command and return intent
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const { command } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command is required' });
    }

    const intent = await parseCommand(command);
    const needsApproval = requiresApproval(intent);
    const preview = needsApproval ? generatePreview(intent, command) : undefined;

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
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { userId, command, intent, requiresApproval: needsApproval, preview } = req.body;

    if (!userId || !command || !intent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const task = {
      user_id: userId,
      raw_command: command,
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
router.post('/execute', async (req: Request, res: Response) => {
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
    const { data: user } = await supabase
      .from('users')
      .select('google_tokens')
      .eq('id', userId)
      .single();

    // If no Google tokens, return mock success for testing
    if (!user?.google_tokens) {
      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          result: { success: true, message: 'Task queued (Google OAuth required for real execution)' },
          executed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);
      
      return res.json({
        success: true,
        result: { success: true, message: 'Task queued (OAuth required)' },
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
          const events = await listEvents(user.google_tokens, 50);
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
            
            await updateEvent(user.google_tokens, targetEvent.id!, {
              start: newStart.toISOString(),
              end: newEnd.toISOString(),
            });
            
            result = { success: true, message: `Meeting rescheduled to ${newStart.toLocaleString()}` };
          } else {
            result = { success: false, message: 'Meeting not found at specified time' };
          }
        } else if (intent.action === 'cancel_meeting') {
          const events = await listEvents(user.google_tokens, 50);
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
            await deleteEvent(user.google_tokens, targetEvent.id);
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
            user.google_tokens,
            summary,
            startTime.toISOString(),
            endTime.toISOString(),
            description
          );
          
          result = { success: true, message: `${summary} scheduled for ${startTime.toLocaleString()}` };
        }
      } else if (intent.domain === 'email') {
        if (intent.action === 'summarize_inbox') {
          const messages = await listMessages(user.google_tokens, 10);
          result = { 
            success: true, 
            message: `Found ${messages.length} recent emails. Summary feature coming soon.`,
            data: { messageCount: messages.length }
          };
        } else if (intent.action === 'send_email') {
          // For now, just draft the email
          const to = intent.entities.to || intent.entities.recipient || '';
          const subject = intent.entities.subject || 'No Subject';
          const body = intent.entities.body || intent.entities.message || '';
          
          if (to) {
            await draftEmail(user.google_tokens, to, subject, body);
            result = { success: true, message: 'Email draft created' };
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

// Get user tasks
router.get('/user/:userId', async (req: Request, res: Response) => {
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
router.post('/approve', async (req: Request, res: Response) => {
  try {
    const { taskId, userId } = req.body;

    const { data, error } = await supabase
      .from('tasks')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
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
router.post('/reject', async (req: Request, res: Response) => {
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

