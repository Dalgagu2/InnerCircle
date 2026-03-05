import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { Contact } from '../constants/types';

// ─── Permission ───────────────────────────────────────────────────────

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

// ─── Types ────────────────────────────────────────────────────────────

interface CalendarMatch {
  contactId: string;
  contactName: string;
  eventTitle: string;
  eventDate: string;
  matchType: 'attendee' | 'title';
}

// ─── Name Matching ────────────────────────────────────────────────────

function normalise(str: string): string {
  return str.toLowerCase().replace(/[^a-z ]/g, '').trim();
}

function namesMatch(contactName: string, testName: string): boolean {
  const cn = normalise(contactName);
  const tn = normalise(testName);
  if (!cn || !tn) return false;

  // Exact match
  if (cn === tn) return true;

  // Contact's full name appears in the test string
  if (tn.includes(cn)) return true;

  // First + last name matching
  const contactParts = cn.split(' ').filter(Boolean);
  const testParts = tn.split(' ').filter(Boolean);

  if (contactParts.length === 0 || testParts.length === 0) return false;

  // First name match (at least 3 chars to avoid false positives like "Jo")
  const firstName = contactParts[0];
  if (firstName.length >= 3 && testParts.some(tp => tp === firstName)) {
    // If contact has a last name, check that too
    if (contactParts.length > 1) {
      const lastName = contactParts[contactParts.length - 1];
      return testParts.some(tp => tp === lastName);
    }
    return true;
  }

  // Last name match (only if contact has first + last)
  if (contactParts.length >= 2) {
    const lastName = contactParts[contactParts.length - 1];
    if (lastName.length >= 3 && testParts.some(tp => tp === lastName)) {
      return testParts.some(tp => tp === contactParts[0]);
    }
  }

  return false;
}

function contactNameInText(contactName: string, text: string): boolean {
  const cn = normalise(contactName);
  const t = normalise(text);
  if (!cn || !t) return false;

  // Full name in title
  if (t.includes(cn)) return true;

  // First name in title (only for names >= 4 chars to reduce false positives)
  const firstName = cn.split(' ')[0];
  if (firstName.length >= 4) {
    // Check as a whole word using word boundaries
    const words = t.split(' ');
    if (words.includes(firstName)) return true;
  }

  return false;
}

// ─── Calendar Scanning ────────────────────────────────────────────────

export async function scanCalendarForMatches(
  contacts: Contact[],
  daysBack: number = 30,
): Promise<CalendarMatch[]> {
  const granted = await requestCalendarPermission();
  if (!granted) return [];

  // Get all calendars
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  // Filter to useful calendars (skip birthdays, holidays)
  const validCalendars = calendars.filter(cal => {
    const title = (cal.title || '').toLowerCase();
    return !title.includes('birthday') && !title.includes('holiday') && cal.allowsModifications !== false;
  });

  if (validCalendars.length === 0) return [];

  const calendarIds = validCalendars.map(c => c.id);

  // Fetch events from the past N days up to today
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  let events: Calendar.Event[] = [];
  try {
    events = await Calendar.getEventsAsync(
      calendarIds,
      startDate,
      endDate,
    );
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }

  // Match events against contacts
  const matches: CalendarMatch[] = [];
  const matchedContactIds = new Set<string>();

  for (const event of events) {
    if (!event.startDate) continue;
    const eventDate = new Date(event.startDate).toISOString().split('T')[0];

    for (const contact of contacts) {
      // Skip if we already found a more recent match for this contact
      if (matchedContactIds.has(contact.id)) {
        const existing = matches.find(m => m.contactId === contact.id);
        if (existing && existing.eventDate >= eventDate) continue;
      }

      // Check attendees
      let matched = false;
      if (event.attendees && event.attendees.length > 0) {
        for (const attendee of event.attendees) {
          const attendeeName = attendee.name || '';
          if (namesMatch(contact.name, attendeeName)) {
            // Remove old match if exists (we want the most recent)
            const existingIdx = matches.findIndex(m => m.contactId === contact.id);
            if (existingIdx >= 0) matches.splice(existingIdx, 1);

            matches.push({
              contactId: contact.id,
              contactName: contact.name,
              eventTitle: event.title || 'Untitled event',
              eventDate,
              matchType: 'attendee',
            });
            matchedContactIds.add(contact.id);
            matched = true;
            break;
          }
        }
      }

      // Check event title (if not already matched via attendee)
      if (!matched && event.title) {
        if (contactNameInText(contact.name, event.title)) {
          const existingIdx = matches.findIndex(m => m.contactId === contact.id);
          if (existingIdx >= 0) {
            // Only replace if this is more recent
            if (matches[existingIdx].eventDate < eventDate) {
              matches.splice(existingIdx, 1);
            } else {
              continue;
            }
          }

          matches.push({
            contactId: contact.id,
            contactName: contact.name,
            eventTitle: event.title,
            eventDate,
            matchType: 'title',
          });
          matchedContactIds.add(contact.id);
        }
      }
    }
  }

  // Sort by date descending (most recent first)
  matches.sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  return matches;
}

// ─── Apply Matches ────────────────────────────────────────────────────

export function applyCalendarMatches(
  contacts: Contact[],
  matches: CalendarMatch[],
): { updatedContacts: Contact[]; updateCount: number } {
  let updateCount = 0;
  const updatedContacts = contacts.map(contact => {
    const match = matches.find(m => m.contactId === contact.id);
    if (!match) return contact;

    // Only update if the calendar event is more recent than the last logged interaction
    const currentLast = contact.lastInteraction;
    if (currentLast && currentLast >= match.eventDate) return contact;

    updateCount++;
    return {
      ...contact,
      lastInteraction: match.eventDate,
      interactionType: '📅 Calendar Event',
      history: [
        { date: match.eventDate, type: `📅 ${match.eventTitle}` },
        ...(contact.history || []),
      ].slice(0, 50),
    };
  });

  return { updatedContacts, updateCount };
}
