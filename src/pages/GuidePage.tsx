import { useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { setNav } from '../lib/motion';
import { TERMS, TOPICS, glassMl, isTermKind, termsOf } from '../lib/glossary';
import { plural } from '../lib/cocktails';
import { useInventory } from '../lib/inventory';
import { NavBar, useNavReveal } from '../components/ui/NavBar';
import { GlassGuideTile, GuideRow, GuideTile } from '../components/ui/GuideParts';
import { TermSheet, useTermSheet } from '../components/TermSheet';
import { NotFoundPage } from './NotFoundPage';

export const articlesLabel = (n: number) => `${n} ${plural(n, ['статья', 'статьи', 'статей'])}`;

/** Заголовок страницы азбуки: место под закреплённые кнопки навбара, крупное название, подпись */
function GuideHeader({ title, sub, titleRef }: { title: string; sub: string; titleRef: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <header className="pt-safe px-4">
      <div className="mt-2 h-nav-btn" aria-hidden />
      <h1 ref={titleRef} className="mt-2 font-display text-display text-fg">
        {title}
      </h1>
      <p className="mt-1 text-footnote text-fg-2">{sub}</p>
    </header>
  );
}

/** «Назад»: из приложения — по истории, по прямой ссылке — на уровень выше */
function useBack(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();
  return () => (location.key !== 'default' ? navigate(-1) : (setNav('back'), navigate(fallback, { viewTransition: true })));
}

/** Главная «Барной азбуки»: плитки тем — в каждую можно зайти */
export function GuidePage() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const navVisible = useNavReveal(titleRef);
  const back = useBack('/bar');
  return (
    <main className="pb-safe">
      <GuideHeader title="Барная азбука" sub={articlesLabel(TERMS.length)} titleRef={titleRef} />
      <NavBar tone="plain" title="Барная азбука" onBack={back} visible={navVisible} />
      <ul className="mt-5 grid grid-cols-2 gap-3 px-4">
        {TOPICS.map((t) => {
          const items = termsOf(t.id);
          return (
            <li key={t.id}>
              <GuideTile
                topic={t.id}
                label={t.label}
                count={articlesLabel(items.length)}
                hint={`${items.slice(0, 3).map((x) => x.name).join(', ')}…`}
                to={`/guide/${t.id}`}
              />
            </li>
          );
        })}
      </ul>
    </main>
  );
}

/** Страница темы: бокалы — сеткой силуэтов, остальное — строками; статья — шторка (#term-…) */
export function GuideTopicPage() {
  const { topic } = useParams();
  const { owned } = useInventory();
  const { term, openTerm, closeTerm } = useTermSheet();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const navVisible = useNavReveal(titleRef, [topic]);
  const back = useBack('/guide');
  if (!isTermKind(topic ?? null)) return <NotFoundPage title="Раздел не найден" to="/guide" toLabel="В азбуку" />;
  const meta = TOPICS.find((t) => t.id === topic)!;
  const items = termsOf(meta.id);

  return (
    <main className="pb-safe">
      <GuideHeader title={meta.label} sub={articlesLabel(items.length)} titleRef={titleRef} />
      <NavBar tone="plain" title={meta.label} onBack={back} visible={navVisible} />
      {meta.id === 'glass' ? (
        <ul className="mt-5 grid grid-cols-2 gap-3 px-4">
          {items.map((g) => (
            <li key={g.id}>
              <GlassGuideTile term={g} ml={glassMl(g.id)} onClick={() => openTerm(g)} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-5 flex flex-col gap-2 px-4">
          {items.map((x) => (
            <li key={x.id}>
              <GuideRow term={x} owned={x.kind === 'tool' && owned.has(x.id)} onClick={() => openTerm(x)} />
            </li>
          ))}
        </ul>
      )}
      <TermSheet term={term} open={!!term} onClose={closeTerm} />
    </main>
  );
}
