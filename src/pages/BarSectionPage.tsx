import { useRef } from 'react';
import { Plus } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { SECTIONS, isSectionKey, subsOf } from '../lib/inventory';
import { BarItemRow } from '../components/ui/BarRows';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { TypeNav, typeAnchor } from '../components/ui/TypeNav';
import { IconButton } from '../components/ui/Button';
import { NavBar, useNavReveal } from '../components/ui/NavBar';
import { SectionHeader } from '../components/ui/SectionHeader';
import { BarSheets, useBarNav, useBarRows } from '../components/BarSheets';
import { NotFoundPage } from './NotFoundPage';
import { positionsLabel } from './BarPage';

// высота закреплённого навбара (8 + 56 + 8) + липкий ряд чипсов (68) — куда прокручивать тип
const NAV_OFFSET = 72 + 68;

/** Страница раздела «Моего бара»: только непустые типы, навигация чипсами-якорями, одна кнопка «+» в навбаре */
export function BarSectionPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const rows = useBarRows();
  const { openAdd, openItem } = useBarNav();
  // навбар проявляется, как только заголовок подходит к нему
  const titleRef = useRef<HTMLHeadingElement>(null);
  const navVisible = useNavReveal(titleRef, [section]);
  if (!isSectionKey(section)) return <NotFoundPage title="Раздел не найден" />;

  const meta = SECTIONS.find((s) => s.id === section)!;
  const mine = rows.filter((r) => r.section === section);
  // только типы, где что-то есть
  const types = subsOf(section)
    .map((sub) => ({ sub, items: mine.filter((r) => r.sub === sub.id) }))
    .filter((t) => t.items.length > 0);
  // пришли из бара — назад по истории, по прямой ссылке — в «Мой бар»
  const back = () => (location.key !== 'default' ? navigate(-1) : navigate('/bar'));

  return (
    <main className="pb-safe">
      <header className="pt-safe px-4">
        {/* место под закреплённые кнопки навбара */}
        <div className="mt-2 h-nav-btn" aria-hidden />
        <h1 ref={titleRef} className="mt-2 font-display text-display text-fg">{meta.label}</h1>
        <p className="mt-1 text-footnote text-fg-2">{mine.length ? positionsLabel(mine.length) : 'Пока пусто'}</p>
      </header>
      <NavBar
        tone="plain"
        title={meta.label}
        onBack={back}
        visible={navVisible}
        action={<IconButton icon={Plus} label={`Добавить: ${meta.label.toLowerCase()}`} size="xl" className="bg-tile-strong!" onClick={() => openAdd(section)} />}
      />

      {types.length > 1 && (
        // навигация по типам — только непустые; липнет под закреплёнными кнопками навбара
        <TypeNav
          items={types.map((t) => ({ id: t.sub.id, label: t.sub.label, count: t.items.length }))}
          prefix={`bar-${section}`}
          offset={NAV_OFFSET}
          className="top-under-nav sticky z-10 mt-4 bg-bg py-2"
        />
      )}

      {types.length === 0 ? (
        <EmptyState
          title="Пока пусто"
          hint="Добавьте, что есть дома"
          action={
            <Button icon={Plus} onClick={() => openAdd(section)}>
              Добавить
            </Button>
          }
        />
      ) : (
        types.map(({ sub: s, items }) => (
          <section key={s.id} id={typeAnchor(`bar-${section}`, s.id)} className="mt-5" aria-label={s.label}>
            {/* типы — системный title-2 со счётчиком; «+» нет: добавлять — одной кнопкой в навбаре */}
            <SectionHeader title={s.label} count={items.length} />
            <ul className="mt-1 flex flex-col gap-2 px-4">
              {items.map((r) => (
                <li key={r.id}>
                  <BarItemRow title={r.title} subtitle={r.subtitle} meta={r.meta} onClick={() => openItem(r.id)} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <BarSheets rows={rows} />
    </main>
  );
}
