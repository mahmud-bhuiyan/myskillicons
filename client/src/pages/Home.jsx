import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { buildIconUrl, getServerOrigin } from '../utils/serverUrl';

const DEMO_ICONS = ['js', 'react', 'nodejs', 'python', 'mongodb', 'html', 'css', 'typescript'];

export default function Home() {
  const { theme } = useTheme();
  const iconTheme = theme === 'light' ? 'light' : 'dark';
  const exampleBase = getServerOrigin() || 'https://myskillicons.com';

  return (
    <div className="max-w-5xl mx-auto px-4">

      {/* Hero */}
      <div className="text-center py-20">
        <h1 className="text-5xl font-bold mb-4 tracking-tight">
          Skill icons for<br/>
          <span className="text-yellow-500 dark:text-yellow-400">developers</span>
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
          Showcase your tech skills anywhere — portfolio, README, or client site.
          One URL. No hosting. No CSS.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/playground" className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-300 transition-colors">
            Open Playground
          </Link>
          <Link to="/gallery" className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
            Browse Icons
          </Link>
        </div>
      </div>

      {/* Live demo strip */}
      <div className="text-center mb-16">
        <p className="text-zinc-500 text-sm mb-4">Live preview — all icons served from a single URL</p>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 inline-block">
          <img
            src={buildIconUrl({
              i: DEMO_ICONS.join(','),
              theme: iconTheme,
              width: 48,
              height: 48,
              gap: 12,
            })}
            alt="demo icons"
            className="max-w-full"
          />
        </div>
      </div>

      {/* How it works */}
      <div className="mb-16">
        <h2 className="text-xl font-semibold text-center mb-8">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Pick your icons', desc: 'Choose from 50+ tech icons in the playground' },
            { step: '2', title: 'Customize', desc: 'Set theme (light/dark), size, layout, and spacing' },
            { step: '3', title: 'Copy & embed', desc: 'One URL works in HTML img tags, Markdown, and anywhere else' },
          ].map(item => (
            <div key={item.step} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
              <div className="w-8 h-8 bg-yellow-400 text-black rounded-lg flex items-center justify-center font-bold text-sm mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Code example */}
      <div className="mb-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-3">Paste anywhere that accepts an image URL:</p>
        <pre className="text-sm text-yellow-700 dark:text-yellow-300 font-mono overflow-x-auto">
{`<!-- In HTML -->
<img src="${exampleBase}/icons?i=js,react,nodejs&theme=dark" />

<!-- In Markdown (README) -->
![My Skills](${exampleBase}/icons?i=js,react,nodejs&theme=dark)`}
        </pre>
      </div>

    </div>
  );
}
