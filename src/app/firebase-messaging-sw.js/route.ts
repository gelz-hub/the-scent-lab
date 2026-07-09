import { firebaseConfig } from '@/lib/firebase/config'

// Served at /firebase-messaging-sw.js so it's registrable at the site root
// (required scope for FCM background push). Config is injected server-side
// since a service worker can't read Next.js env vars at build time.
export async function GET() {
  const body = `
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(firebaseConfig)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'The Scent Lab', {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/favicon-32.png',
    data: payload.data || {},
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(clients.openWindow(url));
});
`.trim()

  return new Response(body, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache',
      'Service-Worker-Allowed': '/',
    },
  })
}
