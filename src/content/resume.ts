export type Link = { label: string; href: string };

export type Role = {
  company: string;
  title: string;
  period: string;
  context?: string;
  points: string[];
};

export type Project = {
  name: string;
  stack: string;
  href?: string;
  summary: string;
};

export const profile = {
  name: 'Wang Zhao',
  title: 'Software Engineer',
  location: 'Singapore',
  citizenship: 'Singapore Citizen',
  summary:
    'Two years on a large React and TypeScript micro-frontend platform in the defence sector, plus backend and deployment work.',
  links: [
    { label: '081101wangzhao@gmail.com', href: 'mailto:081101wangzhao@gmail.com' },
    { label: 'github.com/zhaaaoo', href: 'https://github.com/zhaaaoo' },
    { label: 'linkedin.com/in/wangzhao-wz', href: 'https://www.linkedin.com/in/wangzhao-wz/' },
    { label: 'wangzhao.netlify.app', href: 'https://wangzhao.netlify.app' },
  ] satisfies Link[],
};

export const experience: Role[] = [
  {
    company: 'NCS',
    title: 'Software Engineer',
    period: 'Jul 2024 – Present',
    context:
      'Logistics platform for a government defence client, built as React micro-frontends over Spring Boot services.',
    points: [
      'Build features for three of the platform’s micro-frontend apps in React and TypeScript (Redux Toolkit, Ant Design, Module Federation), and fix and extend components in the team’s shared Storybook library.',
      'Built saved table layouts, where each user’s column visibility and order persist to the backend. The team later made it a standard customisation in the design system.',
      'Worked on embedded Qlik analytics dashboards and on shared features across the platform: help centre, notification centre, landing pages and account management.',
      'Restructured a Spring Boot file-validation service for a second, more conditional rule set: template-method and factory classes so processing steps can be reordered, and strategy classes for building rules.',
      'Sped up validation of large multi-file sets with parallel batch reads, and by computing each file’s SHA while reading it line by line, so every file is read once instead of twice.',
      'Set up on-premise servers, wrote the setup and deployment guides, and deployed and debugged on client sites.',
      'Use the client’s approved on-premise AI coding tools for tests and boilerplate, and maintain the repository’s agent rules (for example, rules that block circular dependencies).',
    ],
  },
  {
    company: 'NCS',
    title: 'Software Engineer Intern',
    period: 'May – Aug 2023',
    points: ['Wrote JUnit and Mockito tests for Spring Boot modules ahead of a migration to a new architecture.'],
  },
  {
    company: 'Continental Automotive Singapore',
    title: 'Software Engineer Intern',
    period: 'Jan – Apr 2023',
    points: [
      'Built an Angular dashboard for monitoring bus-driver health and performance, with engineers in Germany.',
    ],
  },
];

export const projects: Project[] = [
  {
    name: 'Spendulu',
    stack: 'React, TypeScript, Vite, Pyodide, Web Workers · built with Claude Code',
    href: 'https://github.com/zhaaaoo/spendulu',
    summary:
      'Personal-finance web app for Singapore, where banks offer no consumer API. Reads PDF statements from five local issuers and runs the Python parsing engine in a Web Worker, so statements never leave the device.',
  },
  {
    name: 'browhen',
    stack: 'Python, SQLAlchemy, Alembic, Postgres, Cloud Run, GitHub Actions · built with Claude Code',
    href: 'https://github.com/zhaaaoo/browhen',
    summary:
      'Telegram bot that finds a day a group chat can meet. The database enforces one open plan per chat, tests check the models against the migrations, and CI runs on every push.',
  },
  {
    name: 'LaparoLymph',
    stack: 'Unity, C#, VR',
    summary:
      'Final-year VR surgery trainer with Duke-NUS and Singapore General Hospital. Built all the software in a team of seven: anatomy viewer, operating-theatre scene, tool physics, guided procedure and scoring. Demoed to surgeons.',
  },
];

export const education = [
  { school: 'Singapore University of Technology and Design', detail: 'B.Eng, Computer Science and Design', period: '2020 – 2024' },
  { school: 'NUS-ISS', detail: 'Graduate Certificate, Designing Modern Software Systems', period: '2025' },
];

export const certifications = ['Professional Scrum Developer I (PSD I)'];

export const skills: { group: string; items: string[] }[] = [
  {
    group: 'Frontend',
    items: ['React', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Redux Toolkit', 'Ant Design', 'Storybook', 'Module Federation', 'Qlik (Nebula.js)', 'Angular'],
  },
  { group: 'Backend', items: ['Java', 'Spring Boot', 'Python', 'Ruby on Rails', 'SQL', 'REST APIs', 'Microservices', 'Keycloak/OIDC'] },
  { group: 'Testing', items: ['Jest', 'React Testing Library', 'JUnit', 'Mockito'] },
  { group: 'Tools', items: ['Git', 'CI/CD', 'Agile/Scrum', 'Jira', 'Unity', 'C#'] },
];

export const languages = ['English', 'Mandarin'];

export const interests = ['Bouldering', 'diving', 'snowboarding', 'dance'];
