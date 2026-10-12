export const intro = {
  line: 'Software engineer in Singapore. I build frontends in React and TypeScript, currently on a large micro-frontend platform in the defence sector.',
  open: 'Open to software and frontend engineering roles in Singapore.',
};

export const interests = ['bouldering', 'diving', 'snowboarding', 'dance'];

export type Story = {
  id: string;
  title: string;
  when: string;
  summary: string;
  points: string[];
  where: string[];
  skills: string[];
};

// NCS work, grouped by what I did rather than by month
export const stories: Story[] = [
  {
    id: 'frontend',
    title: 'Frontend on a micro-frontend platform',
    when: 'Jan 2025 – now',
    summary: 'React and TypeScript features across several micro-frontend apps that load into one shell.',
    points: [
      'Build pages and components across several of the platform’s micro-frontend apps, including pages built around embedded Qlik dashboards.',
      'Built and extended reusable components in the team’s shared Storybook library, such as paginated, user-configurable tables. Saved column layouts started on one screen and other teams are now moving onto them.',
      'Light backend debugging and data preparation on the Spring Boot side when a feature needs it.',
    ],
    where: ['Shell app', 'Feature apps', 'Component library', 'Analytics dashboards'],
    skills: ['React', 'TypeScript', 'Redux Toolkit', 'Ant Design', 'Storybook', 'Java', 'Spring Boot'],
  },
  {
    id: 'validation',
    title: 'A faster, configurable validation CLI',
    when: 'Nov 2024 – Sep 2025',
    summary: 'A Spring Boot command-line app that checks large file sets as they move between machines.',
    points: [
      'Started as its tester, writing code that generates sample files to hit each rule.',
      'Came back as a developer for a second, far more conditional rule set. Restructured it with the original developer (template method, factory and strategy classes) so processing steps can be reordered and rules are built from configurable parts.',
      'Cut validation of a 1 GB file set from about an hour to about 15 minutes: parallel batch reads, a custom buffered reader, and computing each file’s SHA during the read so a file is read once instead of twice.',
      'Also wrote a small Java UDP receiver that checks each packet’s byte structure before saving it, and updated the architecture docs with the architect.',
    ],
    where: ['File transfer', 'Validation CLI', 'Packet receiver'],
    skills: ['Java', 'Spring Boot', 'JUnit', 'SQL'],
  },
  {
    id: 'deployment',
    title: 'Deploying it on site',
    when: 'Jun – Nov 2025',
    summary: 'Getting the platform running on Windows servers at the client’s camps.',
    points: [
      'Deployed the frontend, backend, batch and cache services: IIS, TLS certificates, database access, firewall rules and Windows services (NSSM, WinSW).',
      'Wrote PowerShell scripts to automate the setup, plus the setup and deployment guides.',
      'Debugged configuration and connectivity issues on site. Once the files arrived in a different format from the agreed pattern; the fix was a regex change made there and then.',
    ],
    where: ['On-premise servers', 'Validation CLI'],
    skills: ['PowerShell', 'IIS', 'Windows Server', 'SQL'],
  },
];

export const beforeStories = 'Before that: a graduate bootcamp at NCS, building projects in .NET and Java (Jul – Oct 2024).';

export type ProjectId = 'spendulu' | 'browhen' | 'powder-ping' | 'between-the-lines' | 'laparolymph';

export const siteProjects: {
  id: ProjectId;
  name: string;
  year: string;
  stack: string;
  href?: string;
  why: string;
  how: string;
  note?: string;
  skills: string[];
}[] = [
  {
    id: 'spendulu',
    name: 'Spendulu',
    year: '2026',
    stack: 'React · TypeScript · Python · LLM API · built with Claude Code',
    href: 'https://github.com/zhaaaoo/spendulu',
    why: 'I wanted to track my own spending, and Singapore banks have no open-banking API, so every free tracker falls back to typing things in by hand.',
    how: 'It imports the PDF statements you already get from five local issuers and asks an LLM to categorise shops its rules don’t recognise, sending only the merchant name. Still in progress.',
    note: 'The demo below uses a small JavaScript parser in a Worker and a made-up statement, not the real engine.',
    skills: ['React', 'TypeScript', 'Python'],
  },
  {
    id: 'browhen',
    name: 'browhen',
    year: '2026',
    stack: 'Python · SQLAlchemy · Postgres · Cloud Run · GitHub Actions',
    href: 'https://github.com/zhaaaoo/browhen',
    why: 'Group chats spend forty messages deciding when to meet. Friends use it for the big groups.',
    how: 'One message holds a live calendar everyone taps. The database allows one open plan per chat, which is why no command ever has to ask which plan you mean.',
    skills: ['Python', 'SQL'],
  },
  {
    id: 'powder-ping',
    name: 'powder-ping',
    year: '2026',
    stack: 'Python · Telegram Bot API · GitHub Actions',
    href: 'https://github.com/zhaaaoo/powder-ping',
    why: 'Japanese ski resorts each have their own booking sites, and checking them for opening dates by hand is tedious.',
    how: 'A watcher on a GitHub Actions schedule checks the booking engines and messages you on Telegram the moment a room opens for your dates.',
    skills: ['Python', 'Git'],
  },
  {
    id: 'between-the-lines',
    name: 'between-the-lines',
    year: 'In progress',
    stack: 'JavaScript',
    href: 'https://github.com/zhaaaoo/between-the-lines',
    why: 'For fun: turn a Telegram chat export into a story about the friendship.',
    how: 'Still testing whether the generated insights are actually funny before building any UI.',
    skills: ['JavaScript'],
  },
  {
    id: 'laparolymph',
    name: 'LaparoLymph',
    year: '2024',
    stack: 'Unity · C# · VR',
    why: 'Final-year project with Duke-NUS Medical School and Singapore General Hospital. The surgery it trains is rare and hard to practise.',
    how: 'A VR operating theatre paired with a physical training box. I was on the software side of a team of seven, working across the anatomy viewer, theatre scene, tool physics, guided procedure and scoring. We demoed it to surgeons and showed it at the capstone showcase.',
    skills: [],
  },
];

export const notes = [
  {
    title: 'AI tools, inside the rules',
    body: 'At work only the client’s approved on-premise models are allowed, and they are weaker than commercial ones. I use them for tests, CRUD and model/view-model scaffolding, and maintain the repository’s agent rules, which are strict: for example, no circular dependencies between modules. At home I build side projects with Claude Code.',
  },
  {
    title: 'Small features can become shared ones',
    body: 'Saved table layouts started as a feature for one screen. Other teams are now moving onto them through the shared component library.',
  },
  {
    title: 'Specs and reality differ',
    body: 'On site, files arrived in a different format from the pattern we had agreed. The fix was a regex change, made there and then.',
  },
  {
    title: 'Write it down',
    body: 'I wrote the server setup and deployment guides, and updated the validation CLI’s architecture docs with the architect.',
  },
];
