import { Router } from 'express';
import { listEvents, createEvent, updateEvent, deleteEvent, findEventByTime } from '../services/calendar';
import { supabase } from '../utils/db';

const router = Router();

// Get user's calendar events
router.get('/events', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Get user tokens
    const { data: user } = await supabase
      .from('users')
      .select('google_tokens')
      .eq('id', userId)
      .single();

    if (!user?.google_tokens) {
      return res.status(400).json({ error: 'User not authenticated with Google' });
    }

    const events = await listEvents(user.google_tokens);
    res.json({ events });
  } catch (error) {
    console.error('List events error:', error);
    res.status(500).json({ error: 'Failed to list events' });
  }
});

// Create calendar event
router.post('/events', async (req, res) => {
  try {
    const { userId, summary, startTime, endTime, description } = req.body;

    if (!userId || !summary || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user tokens
    const { data: user } = await supabase
      .from('users')
      .select('google_tokens')
      .eq('id', userId)
      .single();

    if (!user?.google_tokens) {
      return res.status(400).json({ error: 'User not authenticated with Google' });
    }

    const event = await createEvent(user.google_tokens, summary, startTime, endTime, description);
    res.json({ event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update calendar event
router.put('/events/:eventId', async (req, res) => {
  try {
    const { userId, summary, startTime, endTime, description } = req.body;
    const { eventId } = req.params;

    // Get user tokens
    const { data: user } = await supabase
      .from('users')
      .select('google_tokens')
      .eq('id', userId)
      .single();

    if (!user?.google_tokens) {
      return res.status(400).json({ error: 'User not authenticated with Google' });
    }

    const event = await updateEvent(user.google_tokens, eventId, {
      summary,
      start: startTime,
      end: endTime,
      description,
    });

    res.json({ event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete calendar event
router.delete('/events/:eventId', async (req, res) => {
  try {
    const { userId } = req.query;
    const { eventId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Get user tokens
    const { data: user } = await supabase
      .from('users')
      .select('google_tokens')
      .eq('id', userId)
      .single();

    if (!user?.google_tokens) {
      return res.status(400).json({ error: 'User not authenticated with Google' });
    }

    await deleteEvent(user.google_tokens, eventId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;





