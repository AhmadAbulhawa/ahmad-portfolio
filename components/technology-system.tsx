'use client';
import { useState } from 'react';
import { Arrow } from './icons';
import { LiquidForm } from './threeui/liquid-form';
type Group = { name: string; items: string[] };
export function TechnologySystem({ groups }: { groups: Group[] }) {
  const [active, setActive] = useState(0);
  return (
    <section id="skills" className="technology wrap section" aria-labelledby="technology-title">
      <div className="section-top">
        <span className="section-label">03 / TOOLS OF THE TRADE</span>
        <span className="section-aside">A practical toolkit. An evolving perspective.</span>
      </div>
      <div className="technology-layout">
        <div>
          <h2 className="section-title" id="technology-title">
            The craft
            <br />
            behind <em>the feeling.</em>
          </h2>
          <div className="technology-tabs" role="tablist" aria-label="Technology disciplines">
            {groups.map((g, i) => (
              <button
                key={g.name}
                role="tab"
                id={`discipline-${i}`}
                aria-controls={`skills-${i}`}
                aria-selected={active === i}
                tabIndex={active === i ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => {
                  if (
                    ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(
                      e.key,
                    )
                  ) {
                    e.preventDefault();
                    const n =
                      e.key === 'Home'
                        ? 0
                        : e.key === 'End'
                          ? groups.length - 1
                          : (active +
                              (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1) +
                              groups.length) %
                            groups.length;
                    setActive(n);
                    document.getElementById(`discipline-${n}`)?.focus();
                  }
                }}
              >
                <span>0{i + 1}</span>
                {g.name}
                <b>
                  <Arrow diagonal />
                </b>
              </button>
            ))}
          </div>
        </div>
        <div className="technology-field">
          <LiquidForm />
          {groups.map((g, i) => (
            <div
              key={g.name}
              id={`skills-${i}`}
              role="tabpanel"
              aria-labelledby={`discipline-${i}`}
              hidden={active !== i}
            >
              <span className="section-label">{g.name.toUpperCase()}</span>
              <ul className="technology-cluster">
                {g.items.map((item, index) => (
                  <li key={item} style={{ animationDelay: `${index * 35}ms` }}>
                    {item}
                  </li>
                ))}
              </ul>
              <p>
                Clear interfaces. Connected systems.
                <br />
                Ideas made useful through engineering.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
