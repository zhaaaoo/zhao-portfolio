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
      'Build features in React and TypeScript (Redux Toolkit, Ant Design) across several micro-frontend apps, including pages around embedded Qlik dashboards, where I fixed filters being lost between pages.',
      'Added server-side pagination to the shared table component, now used by every app, and built saved column layouts that other teams are moving onto.',
      'Cut validation of a 1 GB file set from about an hour to about 15 minutes in a Spring Boot CLI application, using parallel batch reads, a custom buffered reader, and hashing each file during the read instead of in a separate pass.',
      'Reworked the same application with its original developer so rules are assembled from configurable parts, which let it take on a second, more conditional rule set.',
      'Deployed the platform to on-premise Windows servers (certificates, database scripts, firewall rules, IIS, Spring Boot services), wrote PowerShell scripts to automate the setup, and debugged configuration and connection issues on client sites.',
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
    stack: 'React, TypeScript, Pyodide, Web Workers · built with Claude Code',
    href: 'https://github.com/zhaaaoo/spendulu',
    summary:
      'Personal-finance app that reads PDF bank statements in the browser. The Python parsing engine runs in a Web Worker through Pyodide, so statements never leave the device.',
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
