import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        home: 'index.html',
        auth: 'auth.html',
        profile: 'profile.html',
        request: 'request.html',
        quotes: 'quotes.html',
        help: 'help.html',
        privacy: 'privacy.html',
        terms: 'terms.html',
        admin: 'admin.html',
      },
    },
  },
});
