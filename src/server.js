const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const IS_PROD = process.env.NODE_ENV === 'production';
const THEMES = ['light', 'dark', 'blue'];

// ---------- Налаштування ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Явний маршрут для favicon (працює для всіх сторінок)
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'favicon.ico'));
});

// ---------- "База даних" у пам'яті ----------
const users = []; // { id, username, passwordHash }

// ---------- Мідлвари ----------

// Тема з cookie доступна у всіх шаблонах
app.use((req, res, next) => {
  const theme = req.cookies.theme;
  res.locals.theme = THEMES.includes(theme) ? theme : 'light';
  res.locals.themes = THEMES;
  res.locals.user = null;
  next();
});

// Необов'язкова перевірка JWT: щоб навігація знала, хто залогінений
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      res.locals.user = payload;
    } catch (e) {
      res.clearCookie('token');
    }
  }
  next();
});

// Обов'язкова перевірка JWT для захищених маршрутів
function authRequired(req, res, next) {
  if (!req.user) {
    return res.redirect('/login');
  }
  next();
}

function setAuthCookie(res, user) {
  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    maxAge: 60 * 60 * 1000,
  });
}

// ---------- Маршрути ----------

// Головна (EJS)
app.get('/', (req, res) => {
  res.render('index', { title: 'Головна' });
});

// Сторінка на PUG
app.get('/about', (req, res) => {
  res.render('about.pug', { title: 'Про сайт' });
});

// Збереження теми в cookie
app.post('/theme', (req, res) => {
  const { theme } = req.body;
  if (!THEMES.includes(theme)) {
    return res.status(400).send('Невідома тема');
  }
  res.cookie('theme', theme, {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });
  const back = req.get('Referer') || '/';
  res.redirect(back);
});

// Реєстрація
app.get('/register', (req, res) => {
  res.render('register', { title: 'Реєстрація', error: null });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || password.length < 4) {
    return res.status(400).render('register', {
      title: 'Реєстрація',
      error: 'Введіть логін і пароль (мінімум 4 символи)',
    });
  }
  if (users.find((u) => u.username === username)) {
    return res.status(409).render('register', {
      title: 'Реєстрація',
      error: 'Такий користувач уже існує',
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: users.length + 1, username, passwordHash };
  users.push(user);

  setAuthCookie(res, user);
  res.redirect('/profile');
});

// Вхід
app.get('/login', (req, res) => {
  res.render('login', { title: 'Вхід', error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);

  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).render('login', {
      title: 'Вхід',
      error: 'Невірний логін або пароль',
    });
  }

  setAuthCookie(res, user);
  res.redirect('/profile');
});

// Вихід
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// Захищений маршрут
app.get('/profile', authRequired, (req, res) => {
  res.render('profile', { title: 'Профіль' });
});

// 404
app.use((req, res) => {
  res.status(404).send('Сторінку не знайдено');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
