import httpClient from './httpClient';

export async function getEncouragement() {
  const data = await httpClient.get('/api/companion/encouragement');
  return data.message;
}

export async function listConversations() {
  const data = await httpClient.get('/api/companion/conversations');
  return data.conversations;
}

export async function getMessages(conversationId) {
  const data = await httpClient.get(`/api/companion/conversations/${conversationId}/messages`);
  return data.messages;
}

export async function sendMessage({ conversationId, content }) {
  return httpClient.post('/api/companion/messages', { conversationId, content });
}
