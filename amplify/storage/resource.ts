import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'myProjectStorage',
  access: (allow) => ({
    'media/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
    ],
    'public/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
    ],
  }),
});
