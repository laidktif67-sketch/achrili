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
        privacy: 'privacy.html',
        terms: 'terms.html',
        admin: 'admin.html',
      },
    },
  },
});
