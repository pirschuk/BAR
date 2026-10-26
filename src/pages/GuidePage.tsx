import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { setNav } from '../lib/motion';
import { TERMS, TOPICS, glassMl, isTermKind, termsOf } from '../lib/glossary';
import { plural } from '../lib/cocktails';
import { useInventory } from '../lib/inventory';
import { NavBar, useNavReveal } from '../components/ui/NavBar';
import { TypeNav, typeAnchor } from '../components/ui/TypeNav';
import { SectionHeader } from '../components/ui/SectionHeader';
import { GlassGuideTile, GuideRow } from '../components/ui/GuideParts';
import { TermSheet, useTermSheet } from '../components/TermSheet';

// закреплённый навбар (72) + липкий ряд чипсов (68) — куда прокручивать раздел
const NAV_OFFSET = 72 + 68;
const PREFIX = 'guide';

export const articlesLabel = (n: number) => `${n} ${plural(n, ['статья', 'статьи', 'статей'])}`;

/**
 * «Барная азбука»: как страница раздела бара — крупный заголовок, якоря по темам, разделы подряд.
 * Бокалы — сеткой силуэтов, остальное — строками; статья — шторка (#term-…). ?topic= — сразу к теме.
 */
export function GuidePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { owned } = useInventory();
  const { term, openTerm, closeTerm } = useTermSheet();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const navVisible = useNavReveal(titleRef);
  const back = () => (location.key !== 'default' ? navigate(-1) : (setNav('back'), navigate('/bar', { viewTransition: true })));

  // пришли с плитки темы — сразу к её разделу (один раз, до шторок)
  const topic = params.get('topic');
  useEffect(() => {
    if (!isTermKind(topic) || topic === 'glass') return;
    const el = document.getElementById(typeAnchor(PREFIX, topic));
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET });
    // только при первом показе
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="pb-safe">
      <header className="pt-safe px-4">
        <div className="mt-2 h-nav-btn" aria-hidden />
        <h1 ref={titleRef} className="mt-2 font-display text-display text-fg">
          Барная азбука
        </h1>
        <p className="mt-1 text-footnote text-fg-2">{articlesLabel(TERMS.length)}</p>
      </header>
      <NavBar tone="plain" title="Барная азбука" onBack={back} visible={navVisible} />

      <TypeNav
        items={TOPICS.map((t) => ({ id: t.id, label: t.label }))}
        prefix={PREFIX}
        offset={NAV_OFFSET}
        className="top-under-nav sticky z-10 mt-4 bg-bg py-2"
      />

      {TOPICS.map((t) => {
        const items = termsOf(t.id);
        return (
          <section key={t.id} id={typeAnchor(PREFIX, t.id)} className="mt-5" aria-label={t.label}>
            <SectionHeader title={t.label} count={items.length} />
            {t.id === 'glass' ? (
              <ul className="mt-1 grid grid-cols-2 gap-3 px-4">
                {items.map((g) => (
                  <li key={g.id}>
                    <GlassGuideTile term={g} ml={glassMl(g.id)} onClick={() => openTerm(g)} />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-1 flex flex-col gap-2 px-4">
                {items.map((x) => (
                  <li key={x.id}>
                    <GuideRow term={x} owned={x.kind === 'tool' && owned.has(x.id)} onClick={() => openTerm(x)} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <TermSheet term={term} open={!!term} onClose={closeTerm} />
    </main>
  );
}
