const AUTH_URL = 'https://functions.poehali.dev/bd0ab522-7ccd-41c8-bcf0-46e7c180fe18';
const USERS_URL = 'https://functions.poehali.dev/1317dc42-7cbb-4019-ae9d-718ef6b95713';
const TASKS_URL = 'https://functions.poehali.dev/e9fb56ee-c122-46ad-a62b-5fecae82d558';
const CHAT_URL = 'https://functions.poehali.dev/a1a049e0-acf2-41d1-bc5a-108d1a59071c';
const PRIVATE_CHAT_URL = 'https://functions.poehali.dev/dba9857b-992e-4e1d-863c-f1f101d48484';

export interface User {
  id: number;
  username: string;
  rank: string;
  is_owner: boolean;
  chat_disabled?: boolean;
  created_at?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  target_rank: string;
  assigned_user_id: number | null;
  assigned_username: string | null;
  status: 'new' | 'in_progress' | 'done' | 'cancelled';
  is_accepted: boolean;
  completion_link: string | null;
  created_at: string;
}

export interface PrivateMessage {
  id: number;
  from_user_id: number;
  from_username: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Dialog {
  partner_id: number;
  partner_username: string;
  last_message: string;
  created_at: string;
  has_unread: boolean;
}

export interface Notification {
  id: number;
  task_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

function getToken(): string {
  return localStorage.getItem('sem_token') || '';
}

export async function login(username: string, password: string) {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка входа');
  return data as { token: string; user: User };
}

export async function getTasksData() {
  const res = await fetch(TASKS_URL, {
    headers: { 'X-Auth-Token': getToken() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data as { tasks: Task[]; notifications: Notification[]; me: User };
}

export async function createTask(payload: {
  title: string;
  description: string;
  target_rank: string;
  assigned_user_id?: number | null;
}) {
  const res = await fetch(TASKS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка создания');
  return data;
}

export async function updateTaskStatus(task_id: number, status: string) {
  const res = await fetch(TASKS_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ action: 'update_status', task_id, status }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Ошибка обновления');
  }
}

export async function readNotifications() {
  await fetch(TASKS_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ action: 'read_notifications' }),
  });
}

export async function getUsers() {
  const res = await fetch(USERS_URL, {
    headers: { 'X-Auth-Token': getToken() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data.users as User[];
}

export async function createUser(payload: { username: string; password: string; rank: string }) {
  const res = await fetch(USERS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка создания');
  return data.user as User;
}

export async function updateUser(payload: { id: number; rank?: string; password?: string }) {
  const res = await fetch(USERS_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка обновления');
  return data;
}

export async function cancelTask(task_id: number) {
  const res = await fetch(TASKS_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ action: 'cancel_task', task_id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка отмены');
}

export async function deleteUser(id: number) {
  const res = await fetch(USERS_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка удаления');
}

export interface ChatMessage {
  id: number;
  user_id: number;
  username: string;
  message: string;
  created_at: string;
}

export async function getChatMessages() {
  const res = await fetch(CHAT_URL, {
    headers: { 'X-Auth-Token': getToken() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки чата');
  return data as { messages: ChatMessage[]; me_id: number };
}

export async function sendChatMessage(message: string) {
  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка отправки');
  return data;
}

export async function doneWithLink(task_id: number, link: string) {
  const res = await fetch(TASKS_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ action: 'done_with_link', task_id, link }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
}

export async function acceptTask(task_id: number) {
  const res = await fetch(TASKS_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ action: 'accept_task', task_id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка принятия');
}

export async function toggleUserChat(id: number | null, chat_disabled: boolean) {
  const res = await fetch(USERS_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ action: 'toggle_chat', id, chat_disabled }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
}

export async function getPrivateMessages(withUserId: number) {
  const res = await fetch(`${PRIVATE_CHAT_URL}?with=${withUserId}`, {
    headers: { 'X-Auth-Token': getToken() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data as { messages: PrivateMessage[]; me_id: number };
}

export async function getDialogs() {
  const res = await fetch(PRIVATE_CHAT_URL, {
    headers: { 'X-Auth-Token': getToken() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data as { dialogs: Dialog[] };
}

export async function sendPrivateMessage(to_user_id: number, message: string) {
  const res = await fetch(PRIVATE_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ to_user_id, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка отправки');
  return data;
}

export const RANKS = ['Программист', 'Режиссёр', 'Дизайнер', 'Монтажёр', 'Сценарист', 'Маркетолог', 'Тестировщик'];