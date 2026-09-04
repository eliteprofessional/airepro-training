/**
 * Fallback seed shape for local/docs reference.
 * Runtime catalog comes from GET /api/support/resources (resources.json).
 */
export const supportResourcesSeed = [
  {
    id: 'getting-started',
    slug: 'getting-started',
    title: 'Getting Started',
    description: 'Learn how to get started with Airepro.',
    file: '/support/getting-started.md',
    preview: true,
    download: true,
  },
  {
    id: 'account-management',
    slug: 'account-management',
    title: 'Account Management',
    description: 'Manage your login, password, and account settings.',
    file: '/support/account-management.md',
    preview: true,
    download: true,
  },
  {
    id: 'profile-verification',
    slug: 'profile-verification',
    title: 'Profile Verification',
    description: 'Complete verification so you can apply and get hired.',
    file: '/support/profile-verification.md',
    preview: true,
    download: true,
  },
  {
    id: 'subscription-guide',
    slug: 'subscription-guide',
    title: 'Subscription Guide',
    description: 'Understand plans, billing, and how to manage your subscription.',
    file: '/support/subscription-guide.md',
    preview: true,
    download: true,
  },
  {
    id: 'faq',
    slug: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Answers to common questions.',
    file: '/support/faq.md',
    preview: true,
    download: false,
  },
];
