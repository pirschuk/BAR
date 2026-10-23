import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

type Props = {
  on: boolean;
  onToggle: () => void;
  /** cover — стеклянная L 44 на обложке; bar — тональная 36 в навбаре */
  place: 'cover' | 'bar';
  pressed?: boolean;
};

/**
 * Сердце «в избранное» [Swiggy, Shop]: контур → заливка акцентом, «пульс» 200 мс при добавлении
 * (без анимации при reduced-motion), короткая вибрация на Android. Состояние — aria-pressed.
 */
export function FavoriteButton({ on, onToggle, place, pressed }: Props) {
  // ключ перезапускает анимацию на каждое добавление
  const [beat, setBeat] = useState(0);
  const click = () => {
    if (!on) {
      setBeat((b) => b + 1);
      navigator.vibrate?.(10);
    }
    onToggle();
  };
  return (
    <IconButton
      key={beat}
      icon={Heart}
      label={on ? 'Убрать из избранного' : 'В избранное'}
      aria-pressed={on}
      variant={place === 'cover' ? 'glass' : 'tonal'}
      size={place === 'cover' ? 'l' : 'm'}
      pressed={pressed}
      onClick={click}
      className={cn(on && (place === 'cover' ? 'text-on-media-accent!' : 'text-accent!'))}
      iconClassName={cn(on && 'fill-current', beat > 0 && 'motion-safe:animate-pop')}
    />
  );
}
