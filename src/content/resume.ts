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
    context: 'Logistics management platform for a defence client, built with React micro-frontends and Spring Boot.',
    points: [
      'Build features in React and TypeScript (Redux Toolkit, Ant Design) across several micro-frontend apps, including pages built around embedded Qlik dashboards, plus light backend debugging and data preparation on the Spring Boot side.',
      'Built and extended several reusable React components in the team’s shared Storybook library, such as paginated, user-configurable tables.',
      'Cut validation of a 1 GB file set from about an hour to about 15 minutes in a Spring Boot CLI application, and reworked it with its original developer so validation rules are configurable.',
      'Deployed the platform’s frontend, backend, batch and cache services to Windows servers at the client’s military camps: IIS, TLS certificates, database access, firewall rules and Windows services (NSSM, WinSW), with PowerShell scripts to automate the setup. Debugged configuration and connectivity issues on site.',
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
    stack: 'React, TypeScript, Python, LLM API · built with Claude Code',
    href: 'https://github.com/zhaaaoo/spendulu',
    summary:
      'Expense tracker for Singapore, where banks have no open-banking API. Imports PDF statements from five local issuers and asks an LLM to categorise unfamiliar shops, sending only the merchant name.',
  },
  {
    name: 'LaparoLymph',
    stack: 'Unity, C#, VR',
    summary:
      'VR surgical trainer built with Duke-NUS Medical School and Singapore General Hospital for my final-year project. Contributed to the VR software in a team of seven; demoed to surgeons.',
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
    items: ['React', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Redux Toolkit', 'Ant Design', 'Storybook', 'Angular'],
  },
  { group: 'Backend', items: ['Java', 'Spring Boot', 'SQL', 'REST APIs', 'Python'] },
  { group: 'Testing', items: ['Jest', 'React Testing Library', 'JUnit', 'Mockito'] },
  { group: 'Tools', items: ['Git', 'PowerShell', 'IIS', 'Windows Server'] },
];
