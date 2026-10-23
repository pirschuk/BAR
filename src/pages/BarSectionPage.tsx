import { ChevronLeft, Plus } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { SECTIONS, isSectionKey, subsOf } from '../lib/inventory';
import { AddRow, BarItemRow } from '../components/ui/BarRows';
import { IconButton } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { BarSheets, useBarNav, useBarRows } from '../components/BarSheets';
import { NotFoundPage } from './NotFoundPage';
import { positionsLabel } from './BarPage';

/** Страница раздела «Моего бара» [Insight Timer, talabat]: подкатегории со счётчиком и своим «+»; пустая — AddRow */
export function BarSectionPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const rows = useBarRows();
  const { openAdd, openItem } = useBarNav();
  if (!isSectionKey(section)) return <NotFoundPage title="Раздел не найден" />;

  const meta = SECTIONS.find((s) => s.id === section)!;
  const mine = rows.filter((r) => r.section === section);
  // пришли из бара — назад по истории, по прямой ссылке — в «Мой бар»
  const back = () => (location.key !== 'default' ? navigate(-1) : navigate('/bar'));

  return (
    <main className="pb-safe">
      <header className="pt-safe px-4">
        <div className="flex h-tap items-center justify-between">
          <IconButton icon={ChevronLeft} label="Назад" size="l" className="-ml-1 bg-transparent!" onClick={back} />
          <IconButton icon={Plus} label={`Добавить: ${meta.label.toLowerCase()}`} size="l" className="bg-tile-strong!" onClick={() => openAdd(section)} />
        </div>
        <h1 className="mt-2 font-display text-display text-fg">{meta.label}</h1>
        <p className="mt-1 text-footnote text-fg-2">{mine.length ? positionsLabel(mine.length) : 'Пока пусто'}</p>
      </header>

      {subsOf(section).map((s) => {
        const items = mine.filter((r) => r.sub === s.id);
        // «Своё» (бутылки без типа) — только когда есть
        if (s.id === 'custom' && !items.length) return null;
        return (
          <section key={s.id} className="mt-5" aria-label={s.label}>
            {/* подкатегории — системный title-2: Unbounded только у заголовка страницы, иначе спорят */}
            <SectionHeader
              title={s.label}
              meta={items.length || undefined}
              trailing={
                s.id !== 'custom' && (
                  <IconButton icon={Plus} label={`Добавить ${s.addLabel}`} onClick={() => openAdd(section, s.id)} className="bg-tile!" />
                )
              }
            />
            <ul className="mt-1 flex flex-col gap-2 px-4">
              {items.length ? (
                items.map((r) => (
                  <li key={r.id}>
                    <BarItemRow title={r.title} subtitle={r.subtitle} meta={r.meta} onClick={() => openItem(r.id)} />
                  </li>
                ))
              ) : (
                <li>
                  <AddRow label={s.addLabel} onClick={() => openAdd(section, s.id)} />
                </li>
              )}
            </ul>
          </section>
        );
      })}

      <BarSheets rows={rows} />
    </main>
  );
}
