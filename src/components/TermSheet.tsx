import { ChevronRight, Repeat } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { cocktails } from '../lib/cocktails';
import { canMake, TOOLS, useInventory } from '../lib/inventory';
import { catalogLink, cocktailsFor, glassMl, relatedTitle, termFromHash, termHash, type Term, type TermKind } from '../lib/glossary';
import { BottomSheet } from './ui/BottomSheet';
import { InfoNote } from './ui/Availability';
import { SwitchRow } from './ui/Toggles';
import { CardRail, CardRailItem } from './ui/CardRail';
import { CocktailCard } from './ui/CocktailCard';
import { TermArt } from './ui/GuideParts';

const KIND_LABEL: Record<TermKind, string> = { glass: 'Бокал', tool: 'Инструмент', method: 'Метод', ice: 'Лёд', measure: 'Мера' };

/**
 * Шторка статьи азбуки [Blue Apron]: крупная картинка на плитке, что это и для чего, «Чем заменить» подсказкой,
 * у инструмента — «Есть дома» (тот же стор, что в «Моём баре»), лента коктейлей с этим и «Все N ›» в каталог.
 * Открывается по хэшу #term-<вид>-<id> — со страницы азбуки и с плиток параметров рецепта.
 */
export function TermSheet({ term, open, onClose, inline }: { term?: Term; open: boolean; onClose: () => void; inline?: boolean }) {
  const { inv, owned, toggle } = useInventory();
  if (!term) return <BottomSheet open={false} onClose={onClose} title="" children={null} />;
  const ml = term.kind === 'glass' ? glassMl(term.id) : undefined;
  const related = cocktailsFor(term, cocktails);
  const link = catalogLink(term);
  const inBar = TOOLS.some((t) => t.id === term.id);
  const noSubstitute = term.substitute?.startsWith('Замены нет');

  return (
    <BottomSheet open={open} onClose={onClose} inline={inline} title={term.name}>
      <div className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex h-44 items-center justify-center rounded-tile bg-tile">
          <TermArt term={term} size="l" />
        </div>
        <div>
          <p className="text-footnote text-fg-2">
            {KIND_LABEL[term.kind]}
            {ml && <span className="tabular-nums"> · {ml} мл</span>}
          </p>
          <p className="mt-1 text-body text-fg">{term.what}</p>
          <p className="mt-2 text-body text-fg-2">{term.why}</p>
        </div>
        {term.substitute && (
          <InfoNote tile icon={Repeat}>
            {noSubstitute ? (
              term.substitute
            ) : (
              <>
                <span className="font-semibold text-fg">Чем заменить. </span>
                {term.substitute}
              </>
            )}
          </InfoNote>
        )}
      </div>
      {inBar && (
        <div className="-mt-2 mb-2">
          <SwitchRow title="Есть дома" subtitle="Отмечается и в «Моём баре»" on={owned.has(term.id)} onToggle={() => toggle(term.id)} />
        </div>
      )}
      {related && (
        <section className="pb-4" aria-label={relatedTitle(term)}>
          <div className="flex min-h-tap items-center justify-between gap-3 px-4">
            <h3 className="text-headline text-fg">{relatedTitle(term)}</h3>
            {link && related.length > 0 && (
              <Link to={link} viewTransition className="pressable -mr-2 inline-flex h-tap shrink-0 items-center gap-0.5 rounded-control px-2 text-subhead text-fg-2">
                Все {related.length}
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            )}
          </div>
          {related.length ? (
            <CardRail label={relatedTitle(term)} className="mt-1">
              {related.slice(0, 10).map((c) => (
                <CardRailItem key={c.id}>
                  <CocktailCard cocktail={c} available={canMake(c, inv)} compact />
                </CardRailItem>
              ))}
            </CardRail>
          ) : (
            <p className="px-4 text-subhead text-fg-2">В каталоге пока нет таких коктейлей</p>
          )}
        </section>
      )}
    </BottomSheet>
  );
}

/** Шторка статьи в хэше (#term-…): «Назад» закрывает шторку, а не уходит со страницы */
export function useTermSheet() {
  const location = useLocation();
  const navigate = useNavigate();
  const term = termFromHash(location.hash);
  const openTerm = (t: Pick<Term, 'kind' | 'id'>) =>
    navigate({ search: location.search, hash: termHash(t) }, { state: { sheet: true }, preventScrollReset: true });
  const closeTerm = () => {
    if ((location.state as { sheet?: boolean } | null)?.sheet) navigate(-1);
    else navigate({ search: location.search, hash: '' }, { replace: true, preventScrollReset: true });
  };
  return { term, openTerm, closeTerm };
}
