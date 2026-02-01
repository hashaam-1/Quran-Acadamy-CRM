import api from './config';

export const messagesApi = {
  getConversations: async () => {
    const { data } = await api.get('/messages/conversations');
    return data;
  },

  getConversationById: async (id: string) => {
    const { data } = await api.get(`/messages/conversations/${id}`);
    return data;
  },

  createConversation: async (conversation: any) => {
    const { data } = await api.post('/messages/conversations', conversation);
    return data;
  },

  deleteConversation: async (id: string) => {
    const { data } = await api.delete(`/messages/conversations/${id}`);
    return data;
  },

  markAsRead: async (id: string) => {
    const { data } = await api.put(`/messages/conversations/${id}/mark-read`);
    return data;
  },

  getMessages: async (conversationId: string) => {
    const { data } = await api.get(`/messages/conversations/${conversationId}/messages`);
    return data;
  },

  sendMessage: async (message: any) => {
    const { data } = await api.post('/messages/messages', message);
    return data;
  },
};
