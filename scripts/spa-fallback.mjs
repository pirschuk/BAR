// GitHub Pages не знает про SPA-роуты: прямой заход на /BAR/cocktail/negroni отдаёт 404.html.
// Копия index.html под этим именем загружает приложение, и react-router рисует нужный экран.
import { copyFileSync } from 'node:fs';

copyFileSync('dist/index.html', 'dist/404.html');
console.log('dist/404.html ← dist/index.html');
