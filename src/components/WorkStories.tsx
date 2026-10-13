import { beforeStories, stories } from '../content/site';
import { useHighlight } from '../highlight';

export default function WorkStories() {
  const skill = useHighlight();
  return (
    <div className="stories">
      <p className="mono muted">NCS · Software Engineer · Jul 2024 – now · defence client</p>
      {stories.map((story, i) => (
        <details key={story.id} className="story" open={i === 0} data-match={(skill && story.skills.includes(skill)) || undefined}>
          <summary>
            <span className="story-title">{story.title}</span>
            <span className="mono muted">{story.when}</span>
            <span className="story-summary">{story.summary}</span>
          </summary>
          <ul>
            {story.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="story-where">
            <span className="mono muted">Where it sits</span>
            {story.where.map((w) => (
              <span key={w} className="chip">
                {w}
              </span>
            ))}
          </p>
        </details>
      ))}
      <p className="muted">{beforeStories}</p>
    </div>
  );
}
