import { useMemo, useState } from 'react';
import { ingredients, normalize } from '../../lib/filters';
import { SHELVES, shelfOf, shelfOrder, type Bottle } from '../../lib/inventory';
import { Button } from './Button';
import { Chip } from './Chip';
import { PickRow } from './BarRows';
import { SearchBar } from './SearchBar';
import { TextField } from './TextField';

const OTHER = '__other';

type Draft = Omit<Bottle, 'id'>;

type Props = {
  initial: Draft;
  submitLabel: string;
  onSubmit: (b: Draft) => void;
  /** правка существующей бутылки: ref null значит «Другое», а не «тип не выбран» */
  editing?: boolean;
  /** для витрины: показать выбор типа раскрытым */
  pickingType?: boolean;
};

/**
 * Своя бутылка [Garmin — Create Food, Alta]: название + «Что это?» (тип из словаря — рецепты видят его,
 * или «Другое — не участвует в рецептах») + заметка строкой (год, возраст). Тип обязателен.
 */
export function BottleForm({ initial, submitLabel, onSubmit, editing, pickingType }: Props) {
  const [name, setName] = useState(initial.name);
  const [type, setType] = useState<string | null>(initial.ref ?? (editing ? OTHER : null));
  const [note, setNote] = useState(initial.note ?? '');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(pickingType ?? type === null);

  const options = useMemo(() => {
    const n = normalize(q);
    return ingredients
      .filter((d) => !d.pantry && (!n || [d.name, ...d.aliases].some((x) => normalize(x).includes(n))))
      .sort((a, b) => shelfOrder(a.id) - shelfOrder(b.id) || a.name.localeCompare(b.name, 'ru'))
      .slice(0, 8);
  }, [q]);

  const typeName = type === OTHER ? 'Другое' : ingredients.find((d) => d.id === type)?.name;
  const ready = name.trim().length > 0 && type !== null;
  const choose = (id: string) => {
    setType(id);
    setOpen(false);
    setQ('');
  };

  return (
    <form
      className="flex flex-col gap-5 px-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSubmit({ name: name.trim(), ref: type === OTHER ? null : type, note: note.trim() || undefined });
      }}
    >
      <TextField label="Название" value={name} onChange={setName} placeholder="Laphroaig 10" />

      <div className="flex flex-col gap-1.5">
        <p className="px-1 text-footnote text-fg-2">Что это?</p>
        {typeName && !open ? (
          <div className="flex flex-col items-start gap-1.5">
            <Chip variant="removable" onClick={() => setOpen(true)} aria-label={`Тип: ${typeName}. Изменить`}>
              {typeName}
            </Chip>
            <span className="px-1 text-footnote text-fg-2">{type === OTHER ? 'Не участвует в рецептах' : 'Рецепты увидят бутылку как этот тип'}</span>
          </div>
        ) : (
          <div className="-mx-4 flex flex-col">
            <div className="px-4">
              <SearchBar value={q} onChange={setQ} placeholder="Виски, ром, ликёр…" aria-label="Тип бутылки" />
            </div>
            <div role="radiogroup" aria-label="Тип бутылки" className="mt-1">
              {options.map((d) => (
                <PickRow
                  key={d.id}
                  radio
                  title={d.name}
                  subtitle={SHELVES.find((s) => s.id === shelfOf(d.id))?.label}
                  on={type === d.id}
                  onToggle={() => choose(d.id)}
                />
              ))}
              <PickRow radio title="Другое" subtitle="не участвует в рецептах" on={type === OTHER} onToggle={() => choose(OTHER)} />
            </div>
          </div>
        )}
      </div>

      <TextField label="Заметка" value={note} onChange={setNote} placeholder="Год, возраст — что угодно" hint="Необязательно" />

      <Button type="submit" disabled={!ready} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}

export { OTHER as BOTTLE_OTHER };
