import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Contact } from '../constants/types';
import { TIER_CONFIG } from '../constants/theme';
import { daysSince } from './time';
import { loadContacts, loadSettings } from './storage';

// ─── Setup ────────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return false;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Inner Circle Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  return true;
}

// ─── Message Generators (per tier) ────────────────────────────────────

// TIER 1 — Inner Circle: Urgency-Escalating
function getInnerCircleMessage(contact: Contact, daysOverdue: number): { title: string; body: string } | null {
  const name = contact.name.split(' ')[0]; // first name only

  if (daysOverdue >= 15) {
    return {
      title: `⚠️ ${name} hasn't heard from you`,
      body: `It's been ${daysOverdue + TIER_CONFIG[1].maxDays} days. This is way overdue for your inner circle — reach out now.`,
    };
  }
  if (daysOverdue >= 10) {
    return {
      title: `${name} is slipping away`,
      body: `${daysOverdue + TIER_CONFIG[1].maxDays} days without contact. A quick call today could make their day.`,
    };
  }
  if (daysOverdue >= 5) {
    return {
      title: `Gentle reminder about ${name}`,
      body: `You're ${daysOverdue} days overdue. Even a short text keeps your inner circle strong.`,
    };
  }
  return null;
}

// TIER 2 — Close Friends: Hobbies-Based
function getCloseFriendsMessage(contact: Contact, daysOverdue: number): { title: string; body: string } | null {
  const name = contact.name.split(' ')[0];
  const hobbies = contact.hobbies ? contact.hobbies.split(',').map(h => h.trim()).filter(Boolean) : [];
  const randomHobby = hobbies.length > 0 ? hobbies[Math.floor(Math.random() * hobbies.length)] : null;

  if (daysOverdue >= 15) {
    const body = randomHobby
      ? `It's been a while! Maybe plan a ${randomHobby.toLowerCase()} session with ${name}? ${daysOverdue + TIER_CONFIG[2].maxDays} days and counting.`
      : `${name} would love to hear from you — it's been ${daysOverdue + TIER_CONFIG[2].maxDays} days. What do you two enjoy doing together?`;
    return { title: `🎯 Reconnect with ${name} over a shared hobby`, body };
  }
  if (daysOverdue >= 10) {
    const body = randomHobby
      ? `You and ${name} both love ${randomHobby.toLowerCase()} — send them something cool you found recently!`
      : `You and ${name} haven't talked in ${daysOverdue + TIER_CONFIG[2].maxDays} days. Share something fun!`;
    return { title: `🔥 ${name} + ${randomHobby || 'good times'} = overdue`, body };
  }
  if (daysOverdue >= 5) {
    const body = randomHobby
      ? `Been into any ${randomHobby.toLowerCase()} lately? ${name} probably has — ask them about it!`
      : `A quick check-in with ${name} is overdue. What have you two been up to?`;
    return { title: `💡 Quick idea for catching up with ${name}`, body };
  }
  return null;
}

// TIER 3 — Good Friends: Playful & Nudging
function getGoodFriendsMessage(contact: Contact, daysOverdue: number): { title: string; body: string } | null {
  const name = contact.name.split(' ')[0];

  if (daysOverdue >= 30) {
    return {
      title: `${name} who? 😬`,
      body: `Okay it's been ${daysOverdue + TIER_CONFIG[3].maxDays} days. At this rate they might forget what you look like. Send a meme at minimum!`,
    };
  }
  if (daysOverdue >= 20) {
    return {
      title: `Your friendship with ${name} is gathering dust 🕸️`,
      body: `${daysOverdue + TIER_CONFIG[3].maxDays} days! They're probably wondering if you moved to another country.`,
    };
  }
  if (daysOverdue >= 10) {
    return {
      title: `${name} called... just kidding 😄`,
      body: `But seriously, it's been ${daysOverdue + TIER_CONFIG[3].maxDays} days. A quick "hey how's it going" won't hurt!`,
    };
  }
  return null;
}

// TIER 4 — Casual Friends: Context-Aware (uses knowFrom)
function getCasualFriendsMessage(contact: Contact, daysOverdue: number): { title: string; body: string } | null {
  const name = contact.name.split(' ')[0];
  const context = contact.knowFrom || '';

  if (daysOverdue >= 45) {
    const body = context
      ? `Your ${context.toLowerCase()} friend ${name} — it's been ${daysOverdue + TIER_CONFIG[4].maxDays} days. Even casual friendships need a little love.`
      : `Haven't reached out to ${name} in ${daysOverdue + TIER_CONFIG[4].maxDays} days. A short message keeps the connection alive.`;
    return { title: `👋 Don't lose touch with ${name}`, body };
  }
  if (daysOverdue >= 30) {
    const body = context
      ? `Remember ${name} from ${context.toLowerCase()}? It's been a while — drop them a quick hello.`
      : `${name} might appreciate a check-in. It's been ${daysOverdue + TIER_CONFIG[4].maxDays} days.`;
    return { title: `🔔 Time to check in with ${name}`, body };
  }
  if (daysOverdue >= 15) {
    const body = context
      ? `Your ${context.toLowerCase()} connection ${name} is overdue for a hello. Keep that relationship warm!`
      : `A quick message to ${name} would be nice — it's been ${daysOverdue + TIER_CONFIG[4].maxDays} days.`;
    return { title: `💬 Quick hello for ${name}?`, body };
  }
  return null;
}

// TIER 5 — Acquaintances: Context-Aware (same style, longer intervals)
function getAcquaintancesMessage(contact: Contact, daysOverdue: number): { title: string; body: string } | null {
  const name = contact.name.split(' ')[0];
  const context = contact.knowFrom || '';

  if (daysOverdue >= 45) {
    const body = context
      ? `${name} from ${context.toLowerCase()} — it's been over ${Math.floor((daysOverdue + TIER_CONFIG[5].maxDays) / 30)} months. Worth a quick ping to keep the door open.`
      : `It's been a very long time since you connected with ${name}. A brief message can go a long way.`;
    return { title: `🌐 ${name} is fading from your network`, body };
  }
  if (daysOverdue >= 30) {
    const body = context
      ? `You met ${name} through ${context.toLowerCase()}. It's been a while — maybe send a quick update or article they'd like?`
      : `${name} hasn't heard from you in a while. Even acquaintances appreciate being remembered.`;
    return { title: `📡 Stay on ${name}'s radar`, body };
  }
  if (daysOverdue >= 15) {
    const body = context
      ? `Your ${context.toLowerCase()} acquaintance ${name} is slightly overdue for a touchpoint.`
      : `It might be time for a brief check-in with ${name}.`;
    return { title: `🤝 Touch base with ${name}?`, body };
  }
  return null;
}

// ─── Message Router ───────────────────────────────────────────────────

function getMessageForContact(contact: Contact, dayOffset: number = 0): { title: string; body: string } | null {
  const days = daysSince(contact.lastInteraction);
  const projectedDays = days === Infinity ? Infinity : days + dayOffset;
  const maxDays = TIER_CONFIG[contact.tier]?.maxDays || 30;
  const daysOverdue = projectedDays === Infinity ? Infinity : projectedDays - maxDays;

  if (daysOverdue < 5) return null; // not overdue enough for any notification

  switch (contact.tier) {
    case 1: return getInnerCircleMessage(contact, daysOverdue);
    case 2: return getCloseFriendsMessage(contact, daysOverdue);
    case 3: return getGoodFriendsMessage(contact, daysOverdue);
    case 4: return getCasualFriendsMessage(contact, daysOverdue);
    case 5: return getAcquaintancesMessage(contact, daysOverdue);
    default: return null;
  }
}

// ─── Weekly Digest (Monday) ───────────────────────────────────────────

function buildWeeklyDigest(contacts: Contact[]): { title: string; body: string } | null {
  const overdue: { name: string; tier: number; days: number }[] = [];
  const critical: string[] = [];
  const upcoming: string[] = [];

  for (const c of contacts) {
    const days = daysSince(c.lastInteraction);
    const maxDays = TIER_CONFIG[c.tier]?.maxDays || 30;
    const daysOverdue = days - maxDays;

    if (daysOverdue >= maxDays * 0.5) {
      critical.push(c.name.split(' ')[0]);
    } else if (daysOverdue >= 0) {
      overdue.push({ name: c.name.split(' ')[0], tier: c.tier, days });
    } else if (daysOverdue >= -3) {
      upcoming.push(c.name.split(' ')[0]);
    }
  }

  const total = critical.length + overdue.length;
  if (total === 0 && upcoming.length === 0) {
    return {
      title: '📋 Weekly Friendship Report: All Clear! 🎉',
      body: "You're doing great — everyone is up to date. Keep it up!",
    };
  }

  const parts: string[] = [];

  if (critical.length > 0) {
    parts.push(`🔴 Critical (${critical.length}): ${critical.slice(0, 4).join(', ')}${critical.length > 4 ? ` +${critical.length - 4} more` : ''}`);
  }
  if (overdue.length > 0) {
    const names = overdue.map(o => o.name);
    parts.push(`🟠 Overdue (${overdue.length}): ${names.slice(0, 4).join(', ')}${names.length > 4 ? ` +${names.length - 4} more` : ''}`);
  }
  if (upcoming.length > 0) {
    parts.push(`🟡 Due soon: ${upcoming.slice(0, 3).join(', ')}`);
  }

  // Birthday check for the week
  const birthdayThisWeek = contacts.filter(c => {
    if (!c.birthday) return false;
    const parts = c.birthday.split('/');
    if (parts.length < 2) return false;
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    const now = new Date();
    const thisWeek = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      thisWeek.push({ m: d.getMonth() + 1, d: d.getDate() });
    }
    return thisWeek.some(tw => tw.m === month && tw.d === day);
  });

  if (birthdayThisWeek.length > 0) {
    const bNames = birthdayThisWeek.map(c => `🎂 ${c.name.split(' ')[0]} (${c.birthday})`);
    parts.push(`Birthdays this week: ${bNames.join(', ')}`);
  }

  return {
    title: `📋 Weekly Report: ${total} ${total === 1 ? 'person needs' : 'people need'} your attention`,
    body: parts.join('\n'),
  };
}

// ─── Date Helpers ───────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Next time it will be `hour:minute` (today if it hasn't happened yet, else tomorrow)
function getNextOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  return next.getTime() <= now.getTime() ? addDays(next, 1) : next;
}

// Next time it will be the given weekday (0=Sunday...6=Saturday) at `hour:minute`
function getNextWeekdayAt(weekday: number, hour: number, minute: number): Date {
  let next = getNextOccurrence(hour, minute);
  while (next.getDay() !== weekday) {
    next = addDays(next, 1);
  }
  return next;
}

function getNextBirthdayDate(birthdayStr: string): Date | null {
  if (!birthdayStr) return null;
  const parts = birthdayStr.split('/');
  if (parts.length < 2) return null;

  const month = parseInt(parts[0], 10) - 1; // 0-indexed
  const day = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(day)) return null;

  const todayStart = startOfDay(new Date());
  let year = todayStart.getFullYear();
  if (new Date(year, month, day).getTime() < todayStart.getTime()) {
    year += 1; // already passed this year, roll to next year
  }
  return new Date(year, month, day, 9, 0, 0, 0);
}

// ─── Schedule Functions ───────────────────────────────────────────────

// Picks the single most urgent contact reminder `dayOffset` days from now,
// so scheduled notifications reflect realistic future overdue counts even
// if the app isn't reopened in the meantime.
function pickMostUrgentMessage(
  enabledContacts: Contact[],
  dayOffset: number,
): { contact: Contact; message: { title: string; body: string } } | null {
  let best: { contact: Contact; message: { title: string; body: string }; ratio: number } | null = null;

  for (const contact of enabledContacts) {
    const message = getMessageForContact(contact, dayOffset);
    if (!message) continue;

    const days = daysSince(contact.lastInteraction);
    const projectedDays = days === Infinity ? Infinity : days + dayOffset;
    const maxDays = TIER_CONFIG[contact.tier]?.maxDays || 30;
    const ratio = projectedDays === Infinity ? Infinity : projectedDays / maxDays;

    if (!best || ratio > best.ratio) {
      best = { contact, message, ratio };
    }
  }

  return best ? { contact: best.contact, message: best.message } : null;
}

const REMINDER_LOOKAHEAD_DAYS = 7;

export async function scheduleAllNotifications(): Promise<void> {
  // Cancel all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const contacts = await loadContacts();
  const settings = await loadSettings();

  if (!contacts || !settings.notificationsEnabled) return;

  const DateTrigger = Notifications.SchedulableTriggerInputTypes.DATE;

  // Weekly digest — real content computed now, delivered next Monday morning
  const digest = buildWeeklyDigest(contacts);
  if (digest) {
    await Notifications.scheduleNotificationAsync({
      content: { title: digest.title, body: digest.body },
      trigger: { type: DateTrigger, date: getNextWeekdayAt(1, 9, 0) },
    });
  }

  // Birthday reminders — each scheduled for the exact future date/time it applies to
  for (const contact of contacts) {
    if (!contact.birthday) continue;
    const nextBirthday = getNextBirthdayDate(contact.birthday);
    if (!nextBirthday) continue;

    for (const milestone of [14, 7, 0]) {
      const fireDate = addDays(nextBirthday, -milestone);
      if (fireDate.getTime() <= Date.now()) continue; // that milestone has already passed this cycle

      const message = getBirthdayMessage(contact, milestone);
      if (!message) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          data: { contactId: contact.id, type: 'birthday' },
        },
        trigger: { type: DateTrigger, date: fireDate },
      });
    }
  }

  // Individual contact reminders — one per day for the next week, each with
  // content projected for that day so it stays accurate without the app
  // needing to be reopened. Re-run this whenever contacts/settings change
  // to keep it in sync with real interactions.
  const enabledContacts = contacts.filter(c => settings.enabledTiers.includes(c.tier));
  const firstOccurrence = getNextOccurrence(9, 0);

  for (let i = 0; i < REMINDER_LOOKAHEAD_DAYS; i++) {
    const best = pickMostUrgentMessage(enabledContacts, i + 1);
    if (!best) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: best.message.title,
        body: best.message.body,
        data: { contactId: best.contact.id },
      },
      trigger: { type: DateTrigger, date: addDays(firstOccurrence, i) },
    });
  }
}

// ─── Birthday Helpers ─────────────────────────────────────────────────

function daysUntilBirthday(birthdayStr: string): number | null {
  const nextBirthday = getNextBirthdayDate(birthdayStr);
  if (!nextBirthday) return null;

  const todayStart = startOfDay(new Date());
  const targetStart = startOfDay(nextBirthday);
  return Math.round((targetStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
}

function getBirthdayMessage(contact: Contact, daysUntil: number): { title: string; body: string } | null {
  const name = contact.name.split(' ')[0];

  if (daysUntil === 0) {
    return {
      title: `🎂 It's ${name}'s birthday today!`,
      body: `Don't forget to wish ${name} a happy birthday! A call or heartfelt message will make their day.`,
    };
  }
  if (daysUntil <= 7) {
    return {
      title: `🎂 ${name}'s birthday is in ${daysUntil} day${daysUntil === 1 ? '' : 's'}!`,
      body: `Start thinking about how you want to celebrate with ${name}. A plan now means no last-minute scramble!`,
    };
  }
  if (daysUntil <= 14) {
    return {
      title: `📅 Heads up: ${name}'s birthday is in ${daysUntil} days`,
      body: `${name}'s birthday is coming up on ${contact.birthday}. Plenty of time to plan something thoughtful!`,
    };
  }
  return null;
}

// This function runs the actual notification logic — call it on app open
// and from background tasks
export async function checkAndSendNotifications(): Promise<void> {
  const contacts = await loadContacts();
  const settings = await loadSettings();

  if (!contacts || !settings.notificationsEnabled) return;

  const now = new Date();
  const isMonday = now.getDay() === 1;
  const hour = now.getHours();

  // Check quiet hours
  if (settings.quietHoursStart !== undefined && settings.quietHoursEnd !== undefined) {
    if (hour >= settings.quietHoursStart || hour < settings.quietHoursEnd) {
      return; // In quiet hours, skip
    }
  }

  // Weekly digest on Monday
  if (isMonday) {
    const digest = buildWeeklyDigest(contacts);
    if (digest) {
      await Notifications.scheduleNotificationAsync({
        content: { title: digest.title, body: digest.body },
        trigger: null,
      });
    }
  }

  // Birthday reminders (14 days, 7 days, and day-of)
  for (const contact of contacts) {
    if (!contact.birthday) continue;
    const daysUntil = daysUntilBirthday(contact.birthday);
    if (daysUntil === null) continue;

    // Only send on exact milestone days: 14, 7, and 0
    if (daysUntil === 14 || daysUntil === 7 || daysUntil === 0) {
      const message = getBirthdayMessage(contact, daysUntil);
      if (message) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: message.title,
            body: message.body,
            data: { contactId: contact.id, type: 'birthday' },
          },
          trigger: null,
        });
      }
    }
  }

  // Individual contact notifications (only for enabled tiers)
  const enabledContacts = contacts.filter(c => settings.enabledTiers.includes(c.tier));

  // Pick the most urgent person to notify about (don't spam)
  let mostUrgent: { contact: Contact; message: { title: string; body: string }; ratio: number } | null = null;

  for (const contact of enabledContacts) {
    const message = getMessageForContact(contact);
    if (!message) continue;

    const days = daysSince(contact.lastInteraction);
    const maxDays = TIER_CONFIG[contact.tier]?.maxDays || 30;
    const ratio = days / maxDays;

    if (!mostUrgent || ratio > mostUrgent.ratio) {
      mostUrgent = { contact, message, ratio };
    }
  }

  if (mostUrgent) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: mostUrgent.message.title,
        body: mostUrgent.message.body,
        data: { contactId: mostUrgent.contact.id },
      },
      trigger: null,
    });
  }
}

// ─── Preview Functions (for Settings screen testing) ──────────────────

export function previewNotificationForContact(contact: Contact): { title: string; body: string } | null {
  return getMessageForContact(contact);
}

export function previewWeeklyDigest(contacts: Contact[]): { title: string; body: string } | null {
  return buildWeeklyDigest(contacts);
}

export function previewBirthdayReminders(contacts: Contact[]): { title: string; body: string }[] {
  const reminders: { title: string; body: string }[] = [];
  for (const contact of contacts) {
    if (!contact.birthday) continue;
    const daysUntil = daysUntilBirthday(contact.birthday);
    if (daysUntil === null) continue;
    if (daysUntil <= 14) {
      const message = getBirthdayMessage(contact, daysUntil);
      if (message) reminders.push(message);
    }
  }
  return reminders;
}

export function previewAllNotifications(contacts: Contact[]): { title: string; body: string; type: string }[] {
  const all: { title: string; body: string; type: string }[] = [];

  // Contact reminders
  for (const contact of contacts) {
    const message = getMessageForContact(contact);
    if (message) {
      all.push({ ...message, type: `Tier ${contact.tier} reminder` });
    }
  }

  // Birthday reminders
  for (const contact of contacts) {
    if (!contact.birthday) continue;
    const daysUntil = daysUntilBirthday(contact.birthday);
    if (daysUntil === null) continue;
    if (daysUntil <= 14) {
      const message = getBirthdayMessage(contact, daysUntil);
      if (message) all.push({ ...message, type: 'Birthday reminder' });
    }
  }

  // Weekly digest
  const digest = buildWeeklyDigest(contacts);
  if (digest) all.push({ ...digest, type: 'Weekly digest' });

  return all;
}
