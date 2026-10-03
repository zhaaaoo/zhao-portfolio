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
    'Software engineer with two years on a large React and TypeScript micro-frontend platform in the defence sector. Mostly frontend, with backend and deployment work when the project needed it.',
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
      'Build pages and components for three of the platform’s micro-frontend apps in React and TypeScript (Module Federation, Redux Toolkit, Zustand, Ant Design), on top of the team’s shared Storybook component library.',
      'Developed a Spring Boot file-validation service for large, multi-file data sets. Its rules were far more conditional than the first version’s, so split the original data model into smaller pieces that each rule could compose.',
      'Worked out the read and validation order and added batch parallelism to meet the service’s performance requirements, and updated the architecture documentation with the architect.',
      'Set up servers and wrote the setup and deployment guides for the platform’s applications; deployed and debugged on client sites.',
      'Use the client’s approved on-premise AI coding tools for tests and boilerplate (CRUD, model and view-model layers), and maintain the repository’s agent rules and context files.',
      'Handle production bugs and review teammates’ code.',
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
      'Final-year project with Duke-NUS Medical School and Singapore General Hospital: a VR trainer for a rare pelvic surgery, paired with a 3D-printed haptic training box. Surgeons reported higher confidence after user testing. Team of seven.',
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
    items: ['React', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Micro-frontends (Module Federation)', 'Ant Design', 'Storybook', 'Angular'],
  },
  { group: 'Backend', items: ['Java', 'Spring Boot', 'Python', 'Ruby on Rails', 'SQL', 'REST APIs', 'Microservices'] },
  { group: 'Delivery', items: ['Git', 'CI/CD', 'JUnit', 'Mockito', 'Agile/Scrum', 'Jira'] },
  { group: 'Other', items: ['Unity', 'C#'] },
];

export const languages = ['English', 'Mandarin'];

export const interests = ['Bouldering', 'diving', 'snowboarding', 'dance'];
