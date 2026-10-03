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
  headline: ['Software Engineer', 'React, TypeScript', 'Singapore Citizen'],
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
    context: 'Logistics management platform for a government defence client: React micro-frontends over Spring Boot.',
    points: [
      'Build features in React and TypeScript (Redux Toolkit, Ant Design) across several micro-frontend apps, including pages built around embedded Qlik dashboards.',
      'Built and extended several reusable components in the team’s shared Storybook library, including new features for the shared data table.',
      'Cut validation of a 1 GB file set from about an hour to about 15 minutes in a Spring Boot CLI application by redesigning how files are read and processed, including parallel batch reads and a custom buffered reader.',
      'Reworked the same application with its original developer so rules are assembled from configurable parts, which let it take on a second, more conditional rule set.',
      'Deployed the platform to on-premise Windows servers: configured IIS, TLS certificates, database access and firewall rules, moved the backend services from NSSM to WinSW, and automated the setup with PowerShell. Debugged configuration and connectivity issues on client sites.',
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
    points: ['Built an Angular dashboard for monitoring bus-driver health and performance, with engineers in Germany.'],
  },
];

export const projects: Project[] = [
  {
    name: 'Spendulu',
    stack: 'React, TypeScript, Python, local LLM · built with Claude Code',
    href: 'https://github.com/zhaaaoo/spendulu',
    summary:
      'Expense tracker for Singapore, where banks have no open-banking API. Imports PDF statements from five local issuers and uses a local LLM to categorise unfamiliar shops, without ever letting it change an amount.',
  },
  {
    name: 'LaparoLymph',
    stack: 'Unity, C#, VR',
    summary:
      'VR surgical trainer built with Duke-NUS Medical School and Singapore General Hospital for my final-year project. Wrote all of the software in a team of seven; demoed to surgeons.',
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
    items: ['React', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Redux Toolkit', 'Ant Design', 'Storybook', 'Module Federation', 'Angular'],
  },
  { group: 'Backend', items: ['Java', 'Spring Boot', 'SQL', 'REST APIs', 'Python'] },
  { group: 'Testing', items: ['Jest', 'React Testing Library', 'JUnit', 'Mockito'] },
  { group: 'Tools', items: ['Git', 'PowerShell', 'IIS', 'Windows Server'] },
];
