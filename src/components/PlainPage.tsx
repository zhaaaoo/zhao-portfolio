import { Part } from '../inspect';
import { Colophon, Earlier, Interests, IntroText, Notes, Polaroid } from './Content';
import Projects from './Projects';
import Section from './Section';
import Window from './Window';
import WorkStories from './WorkStories';

export default function PlainPage() {
  return (
    <main id="main" className="plain">
      <Part name="Intro" as="section" id="top" className="intro" aria-label="Introduction">
        <Window title="wangzhao.app">
          <IntroText />
          <Polaroid />
        </Window>
      </Part>

      <Section id="work" n={1} title="Work" file="work" note={<p>The project is for a defence client, so it’s described in general terms.</p>}>
        <WorkStories />
      </Section>

      <Section
        id="projects"
        n={2}
        title="Projects"
        file="projects"
        tone="lilac"
        note={<p>Side projects I built with Claude Code, plus my final-year project. The demos are small rebuilds, not the real apps.</p>}
      >
        <Projects />
      </Section>

      <Section id="notes" n={3} title="How I work" file="notes.txt" tone="mint">
        <Notes />
      </Section>

      <Section id="earlier" n={4} title="Earlier" file="earlier.txt" tone="butter">
        <Earlier />
      </Section>

      <Section id="colophon" n={5} title="This site" file="readme.md" tone="mint">
        <Colophon />
        <Interests />
      </Section>
    </main>
  );
}
