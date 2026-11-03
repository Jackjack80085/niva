import { useState } from 'react';
import { Play, Instagram, Youtube, ArrowUpRight } from 'lucide-react';
import { HandDrawnCurl } from '../common/OrganicMotifs';

const VIDEOS = [
  { id: 'aVbTdL_ua2U', title: 'Sexless marriages', detail: 'Malayalam · Dr. Niva Jacob', topic: 'Intimacy & relationships' },
  { id: 'idP3PW8NFAU', title: 'Trauma Bond', detail: 'Malayalam · Dr. Niva Jacob', topic: 'Emotional patterns' },
  { id: 'iNRkriDWtCw', title: 'James & Alice in Couple’s Therapy', detail: 'Why Their Marriage Failed · Dr. Niva Jacob', topic: 'Couple therapy' },
];

export const TheCurlyShrinkSection = () => {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <section id="the-curly-shrink" className="curly-video-section">
      <div className="curly-video-container">
        <header className="curly-video-heading">
          <p className="curly-video-eyebrow">THE OTHER SIDE OF MY WORK</p>
          <h2>Meet The <em>Curly</em> Shrink.</h2>
          <p>Mental health, sexual health and relationship conversations — made simpler, more relatable and easier to talk about.</p>
          <HandDrawnCurl width={90} strokeWidth={2.4} color="#332B27" delay={0.4} />
        </header>

        <div className="curly-video-grid">
          {VIDEOS.map(video => (
            <article className="curly-video-card" key={video.id}>
              <div className="curly-video-preview">
                {playing === video.id ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
                    title={`${video.title} — The Curly Shrink`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <button type="button" className="curly-video-play" aria-label={`Play ${video.title}`} onClick={() => setPlaying(video.id)}>
                    <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt={`Video thumbnail for ${video.title}`} loading="lazy" width="480" height="360" />
                    <span className="curly-video-shade" />
                    <span className="curly-video-platform"><Youtube size={15} aria-hidden="true" /> The Curly Shrink</span>
                    <span className="curly-video-play-icon"><Play size={22} fill="currentColor" aria-hidden="true" /></span>
                    <span className="curly-video-watch">Watch video</span>
                  </button>
                )}
              </div>
              <div className="curly-video-copy">
                <p className="curly-video-topic">{video.topic}</p>
                <h3>{video.title}</h3>
                <p className="curly-video-detail">{video.detail}</p>
                <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${video.title} on YouTube`}>Watch on YouTube <ArrowUpRight size={14} aria-hidden="true" /></a>
              </div>
            </article>
          ))}
        </div>

        <footer className="curly-video-footer">
          <div><span>@thecurlyshrink</span><p>More conversations, on your favourite platform.</p></div>
          <div className="curly-social-links">
            <a href="https://www.instagram.com/thecurlyshrink?utm_source=ig_web_button_share_sheet&amp;mdxt=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer"><Instagram size={17} aria-hidden="true" /> Instagram <ArrowUpRight size={14} aria-hidden="true" /></a>
            <a href="https://youtube.com/@thecurlyshrink?si=FaFOOMiMarQnIrOu" target="_blank" rel="noopener noreferrer"><Youtube size={18} aria-hidden="true" /> YouTube <ArrowUpRight size={14} aria-hidden="true" /></a>
          </div>
        </footer>
      </div>
    </section>
  );
};
