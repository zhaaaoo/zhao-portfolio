export type NodeId = 'files' | 'validator' | 'udp' | 'servers' | 'shell' | 'library' | 'appA' | 'appB' | 'appC' | 'analytics' | 'api';

export type Stop = {
  id: string;
  start: string; // YYYY-MM
  end?: string;
  // shown instead of the start month when only the year is known
  startLabel?: string;
  role: string;
  nodes: NodeId[];
  did: string;
  hard?: string;
  changed?: string;
};

export const intro = {
  line: 'Software engineer in Singapore. I build frontends in React and TypeScript, currently on a large micro-frontend platform in the defence sector.',
  open: 'Open to software and frontend engineering roles in Singapore.',
};

export const platformNodes: { id: NodeId; label: string; sub: string }[] = [
  { id: 'shell', label: 'Shell', sub: 'login, navigation, shared pages' },
  { id: 'library', label: 'Component library', sub: 'Storybook' },
  { id: 'appA', label: 'Feature app', sub: 'micro-frontend' },
  { id: 'appB', label: 'Feature app', sub: 'micro-frontend' },
  { id: 'appC', label: 'More apps', sub: 'micro-frontends' },
  { id: 'analytics', label: 'Analytics', sub: 'embedded dashboards' },
  { id: 'api', label: 'Services', sub: 'Spring Boot APIs' },
  { id: 'files', label: 'File transfer', sub: 'large file sets' },
  { id: 'validator', label: 'Validation CLI', sub: 'Spring Boot' },
  { id: 'udp', label: 'Packet receiver', sub: 'Java, UDP' },
  { id: 'servers', label: 'On-premise servers', sub: 'setup, deployment' },
];

export const stops: Stop[] = [
  {
    id: 'bootcamp',
    start: '2024-07',
    end: '2024-10',
    role: 'Graduate bootcamp',
    nodes: [],
    did: 'Bootcamp projects in .NET and Java before joining a client project.',
  },
  {
    id: 'tester',
    start: '2024-11',
    end: '2025-01',
    role: 'Tester, file validation',
    nodes: ['files', 'validator'],
    did: 'My first job on the project was testing, not features. The validation CLI is a Spring Boot command-line app that checks large file sets as they move between machines.',
    hard: 'The rules are conditional and files arrive in sets, so hand-made test files ran out fast.',
    changed: 'Wrote code that generates sample files to hit each rule.',
  },
  {
    id: 'frontend-1',
    start: '2025-01',
    end: '2025-04',
    role: 'Frontend, first feature app',
    nodes: ['appA', 'library', 'shell'],
    did: 'Pages and components for one of the micro-frontend apps that load into the shell, in React and TypeScript with Ant Design and the team’s Storybook library.',
  },
  {
    id: 'validator',
    start: '2025-04',
    end: '2025-09',
    role: 'Developer, file validation',
    nodes: ['files', 'validator', 'udp'],
    did: 'Back on the validation CLI as a developer, this time for a second service branch with far more conditional rules. The architect designed the base structure and another developer wrote the first version.',
    hard: 'The original model was designed for the first, simpler rule set and wasn’t modular. Reading and validating also had performance requirements.',
    changed:
      'Restructured it with that developer so processing steps can be reordered and rules are built from configurable parts (template method, factory and strategy classes). Made it much faster: parallel batch reads, a custom buffered reader, and computing each file’s SHA during the read so a file is read once instead of twice. Also wrote a small UDP receiver that polls for packets, checks their byte structure and saves them.',
  },
  {
    id: 'deploy',
    start: '2025-06',
    end: '2025-11',
    role: 'Deployment',
    nodes: ['servers', 'validator'],
    did: 'Deployed the frontend, backend, batch and cache services to Windows servers at the client’s camps: IIS, certificates, database access, firewall rules and Windows services (NSSM, WinSW), with PowerShell scripts to automate the setup. Wrote the setup and deployment guides.',
    hard: 'Configuration and connectivity issues only show up on the real servers. Once, files arrived in a different format from the agreed pattern.',
    changed: 'Debugged them on site; the file format one was a regex change made there and then.',
  },
  {
    id: 'common',
    start: '2025-06',
    role: 'Frontend, shared features',
    nodes: ['shell', 'library', 'analytics'],
    did: 'Shared features in the shell and the component library, plus pages built around embedded analytics dashboards. Some light backend debugging and data preparation on the side.',
    changed:
      'Built and extended several reusable components in the shared Storybook library, such as paginated, user-configurable tables. The saved table layouts started on one screen and other teams are now moving onto them.',
  },
  {
    id: 'frontend-2',
    start: '2026-01',
    startLabel: '2026',
    role: 'Frontend, second feature app',
    nodes: ['appB', 'library', 'api'],
    did: 'Development and bug fixes on another feature app.',
  },
];

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
  },
  {
    id: 'browhen',
    name: 'browhen',
    year: '2026',
    stack: 'Python · SQLAlchemy · Postgres · Cloud Run · GitHub Actions',
    href: 'https://github.com/zhaaaoo/browhen',
    why: 'Group chats spend forty messages deciding when to meet. Friends use it for the big groups.',
    how: 'One message holds a live calendar everyone taps. The database allows one open plan per chat, which is why no command ever has to ask which plan you mean.',
  },
  {
    id: 'powder-ping',
    name: 'powder-ping',
    year: '2026',
    stack: 'Python · Telegram Bot API · GitHub Actions',
    href: 'https://github.com/zhaaaoo/powder-ping',
    why: 'Japanese ski resorts each have their own booking sites, and checking them for opening dates by hand is tedious.',
    how: 'A watcher on a GitHub Actions schedule checks the booking engines and messages you on Telegram the moment a room opens for your dates.',
  },
  {
    id: 'between-the-lines',
    name: 'between-the-lines',
    year: 'In progress',
    stack: 'JavaScript',
    href: 'https://github.com/zhaaaoo/between-the-lines',
    why: 'For fun: turn a Telegram chat export into a story about the friendship.',
    how: 'Still testing whether the generated insights are actually funny before building any UI.',
  },
  {
    id: 'laparolymph',
    name: 'LaparoLymph',
    year: '2024',
    stack: 'Unity · C# · VR',
    why: 'Final-year project with Duke-NUS Medical School and Singapore General Hospital. The surgery it trains is rare and hard to practise.',
    how: 'A VR operating theatre paired with a physical training box. I was on the software side of a team of seven, working across the anatomy viewer, theatre scene, tool physics, guided procedure and scoring. We demoed it to surgeons and showed it at the capstone showcase.',
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
