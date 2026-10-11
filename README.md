# ДЗ 63.1. Статичні файли, Cookies та JWT на Express

Навчальний сервер на Node.js + Express: favicon, збереження теми в cookies, реєстрація/вхід через JWT.

## Встановлення та запуск

```bash
git clone <посилання-на-репозиторій>
cd hw63-1
npm install
npm start
```

Сервер буде доступний на http://localhost:3000

Файл `public/favicon.ico` вже є в репозиторії. Щоб згенерувати його заново: `npm run favicon`.

Змінні оточення (необов'язково):
- `PORT` — порт (за замовчуванням 3000)
- `JWT_SECRET` — секрет для підпису JWT
- `NODE_ENV=production` — вмикає `secure` для cookie з токеном

## Структура проєкту

```
hw63-1/
├── src/server.js        # код сервера
├── public/              # статичні файли (style.css, favicon.ico)
├── views/               # шаблони EJS і PUG
├── scripts/make-favicon.js
├── package.json
└── README.md
```

## Функціональність

- **Статичні файли**: папка `public` (CSS, favicon). Favicon підключений у всіх шаблонах EJS і PUG тегом `<link rel="icon" href="/favicon.ico">`, а також відправляється окремим маршрутом `/favicon.ico`.
- **Cookies**: `cookie-parser`, тема оформлення (`light`, `dark`, `blue`) зберігається в cookie `theme` на 1 рік.
- **JWT**: токен створюється при реєстрації/вході, зберігається в cookie `token` з `httpOnly`, діє 1 годину. Мідлвар `authRequired` перевіряє токен для захищених маршрутів.
- Паролі зберігаються у вигляді хешів (`bcryptjs`).

## Маршрути

| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/` | Головна сторінка (EJS) |
| GET | `/about` | Сторінка на PUG |
| GET | `/favicon.ico` | Відправляє favicon |
| POST | `/theme` | Зберігає вибрану тему в cookie `theme`, редирект назад |
| GET | `/register` | Форма реєстрації |
| POST | `/register` | Створює користувача, видає JWT у httpOnly cookie, редирект на `/profile` |
| GET | `/login` | Форма входу |
| POST | `/login` | Перевіряє дані, видає JWT, редирект на `/profile`; 401 при помилці |
| GET | `/logout` | Видаляє cookie `token`, редирект на `/` |
| GET | `/profile` | **Захищений** маршрут; без валідного JWT — редирект на `/login` |

## Обмеження (навчальний проєкт)

- Користувачі зберігаються в пам'яті й зникають після перезапуску; у реальному проєкті потрібна база даних.
- `JWT_SECRET` у реальному проєкті має зберігатися в `.env`.
- Для POST-форм бракує CSRF-захисту (токен лежить у cookie).
