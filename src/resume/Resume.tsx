import { certifications, education, experience, interests, languages, profile, projects, skills } from '../content/resume';
import headshot from '../assets/images/zhao-headshot.jpg';

export default function Resume() {
  return (
    <main className="page">
      <header className="head">
        <div>
          <h1>{profile.name}</h1>
          <p className="role">
            {profile.title} · {profile.location} · {profile.citizenship}
          </p>
          <p className="links">
            {profile.links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </p>
        </div>
        <img className="photo" src={headshot} alt="" width={220} height={275} />
      </header>

      <p className="summary">{profile.summary}</p>

      <section>
        <h2>Experience</h2>
        {experience.map((role) => (
          <article key={role.company + role.title} className="entry">
            <div className="entry-head">
              <h3>
                {role.title}, {role.company}
              </h3>
              <span className="period">{role.period}</span>
            </div>
            {role.context && <p className="context">{role.context}</p>}
            {role.points.length > 1 ? (
              <ul>
                {role.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : (
              <p>{role.points[0]}</p>
            )}
          </article>
        ))}
      </section>

      <section>
        <h2>Projects</h2>
        {projects.map((project) => (
          <article key={project.name} className="entry">
            <div className="entry-head">
              <h3>{project.href ? <a href={project.href}>{project.name}</a> : project.name}</h3>
              <span className="stack">{project.stack}</span>
            </div>
            <p>{project.summary}</p>
          </article>
        ))}
      </section>

      <section>
        <h2>Education</h2>
        {education.map((item) => (
          <div key={item.school} className="entry-head">
            <span>
              <strong>{item.school}</strong>, {item.detail}
            </span>
            <span className="period">{item.period}</span>
          </div>
        ))}
        <p>{certifications.join(' · ')}</p>
      </section>

      <section>
        <h2>Skills</h2>
        {[...skills, { group: 'Languages', items: languages }, { group: 'Interests', items: interests }].map((row) => (
          <p key={row.group}>
            <strong>{row.group}:</strong> {row.items.join(', ')}
          </p>
        ))}
      </section>
    </main>
  );
}
