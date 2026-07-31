import type { Conversation, ChatMessage } from '@/types/inbox';

export const conversations: Conversation[] = [
  { id: 'conv-1', contactName: 'Zeynep Arslan', avatarInitials: 'ZA', channel: 'whatsapp', lastMessage: 'Teşekkürler, orada olacağım!', lastMessageTime: 'Bugün 11:04', unread: true, tagId: 'A142' },
  { id: 'conv-2', contactName: 'Ayşe Korkmaz', avatarInitials: 'AK', channel: 'instagram', lastMessage: 'Yarın saat kaçta yer var acaba?', lastMessageTime: 'Bugün 10:20', unread: false },
  { id: 'conv-3', contactName: 'Ali Güneş', avatarInitials: 'AG', channel: 'whatsapp', lastMessage: 'Teşekkürler, o zaman yarın görüşürüz', lastMessageTime: 'Dün 18:45', unread: false },
  { id: 'conv-4', contactName: 'Seda İnce', avatarInitials: 'Sİ', channel: 'instagram', lastMessage: 'Fiyat bilgisi alabilir miyim?', lastMessageTime: 'Dün 16:12', unread: true, tagId: 'A139' },
  { id: 'conv-5', contactName: 'Burak Şahin', avatarInitials: 'BŞ', channel: 'whatsapp', lastMessage: 'Reformer paketi hâlâ geçerli mi?', lastMessageTime: 'Dün 09:30', unread: false },
  { id: 'conv-6', contactName: 'Cansu Aydın', avatarInitials: 'CA', channel: 'instagram', lastMessage: 'Deneme dersi için teşekkürler, kayıt olmak istiyorum', lastMessageTime: '2 gün önce', unread: false },
  { id: 'conv-7', contactName: 'Onur Kara', avatarInitials: 'OK', channel: 'whatsapp', lastMessage: 'Salı günü müsait misiniz?', lastMessageTime: '3 gün önce', unread: false },
  { id: 'conv-8', contactName: 'Merve Taş', avatarInitials: 'MT', channel: 'instagram', lastMessage: 'Harika, görüşmek üzere!', lastMessageTime: '4 gün önce', unread: false },
];

export const messagesByConversation: Record<string, ChatMessage[]> = {
  'conv-1': [
    { id: 'msg-1', conversationId: 'conv-1', sender: 'contact', senderName: 'Zeynep Arslan', text: 'Merhaba, reformer pilates için deneme dersi almak istiyorum', time: '10:58' },
    { id: 'msg-2', conversationId: 'conv-1', sender: 'studio', senderName: 'Ece Yıldız', text: 'Merhaba Zeynep Hanım, tabii ki! Hangi gün ve saat sizin için uygun olur?', time: '11:00', read: true },
    { id: 'msg-3', conversationId: 'conv-1', sender: 'contact', senderName: 'Zeynep Arslan', text: 'Yarın öğleden sonra uygun olur', time: '11:02' },
    { id: 'msg-4', conversationId: 'conv-1', sender: 'studio', senderName: 'Ece Yıldız', text: 'Harika, yarın 14:00\'te Reformer Pilates dersimiz var, sizi bekleriz.', time: '11:03', read: true },
    { id: 'msg-5', conversationId: 'conv-1', sender: 'contact', senderName: 'Zeynep Arslan', text: 'Teşekkürler, orada olacağım!', time: '11:04' },
  ],
  'conv-2': [
    { id: 'msg-6', conversationId: 'conv-2', sender: 'contact', senderName: 'Ayşe Korkmaz', text: 'Merhaba, yarın saat kaçta yer var acaba?', time: '10:15' },
    { id: 'msg-7', conversationId: 'conv-2', sender: 'studio', senderName: 'Ayşe Kaya', text: 'Merhaba, yarın 10:00 ve 12:00 seanslarımızda yer mevcut.', time: '10:20', read: true },
  ],
  'conv-3': [
    { id: 'msg-8', conversationId: 'conv-3', sender: 'studio', senderName: 'Can Demir', text: 'Yarınki fonksiyonel antrenman seansınız 10:30\'da, unutmayın.', time: '18:40', read: true },
    { id: 'msg-9', conversationId: 'conv-3', sender: 'contact', senderName: 'Ali Güneş', text: 'Teşekkürler, o zaman yarın görüşürüz', time: '18:45' },
  ],
  'conv-4': [
    { id: 'msg-10', conversationId: 'conv-4', sender: 'contact', senderName: 'Seda İnce', text: 'Merhaba, yoga paketi fiyat bilgisi alabilir miyim?', time: '16:12' },
  ],
  'conv-5': [
    { id: 'msg-11', conversationId: 'conv-5', sender: 'contact', senderName: 'Burak Şahin', text: 'Reformer paketi hâlâ geçerli mi?', time: '09:30' },
  ],
  'conv-6': [
    { id: 'msg-12', conversationId: 'conv-6', sender: 'studio', senderName: 'Ece Yıldız', text: 'Deneme dersiniz nasıldı, sorularınız varsa buradayız.', time: 'Pazartesi 14:00', read: true },
    { id: 'msg-13', conversationId: 'conv-6', sender: 'contact', senderName: 'Cansu Aydın', text: 'Deneme dersi için teşekkürler, kayıt olmak istiyorum', time: 'Pazartesi 15:30' },
  ],
  'conv-7': [
    { id: 'msg-14', conversationId: 'conv-7', sender: 'contact', senderName: 'Onur Kara', text: 'Salı günü müsait misiniz?', time: 'Pazar 12:00' },
  ],
  'conv-8': [
    { id: 'msg-15', conversationId: 'conv-8', sender: 'studio', senderName: 'Melis Kara', text: 'Yoga dersimize bekleriz!', time: 'Cuma 09:00', read: true },
    { id: 'msg-16', conversationId: 'conv-8', sender: 'contact', senderName: 'Merve Taş', text: 'Harika, görüşmek üzere!', time: 'Cuma 09:05' },
  ],
};
