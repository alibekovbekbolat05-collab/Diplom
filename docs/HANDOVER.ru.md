# Передача проекта Diplom

## 1. Что построено

Сайт Aspan Security на русском, английском и казахском с жидкой навигацией, темами и публичными страницами.
Встроенная консоль SecureOps: события, объяснимые алерты, кейсы, активы, источники, правила, анализ файлов, отчёты, настройки и аудит.
Серверный ingest, 25 безопасных правил, детекторы, корреляция, синтетическая ML-модель и отдельные UEBA-истории пользователей и хостов.
Демо работает только на чтение; реальные операции защищены сессией, ролью, Origin и CSRF.

## 2. Структура

```text
app/[locale]/(site)/       публичный сайт
app/[locale]/(platform)/   консоль
app/api/                  API
components/               интерфейс и SVG-визуализации
config/                   компания, диплом, контакты
content/                  переводы, метрики, threat snapshot
server/                   парсеры, детекторы, правила, ML, auth, store
ml/                       обучение Python, preprocessing, parity
agent/                    локальная отправка логов
scripts/                  генератор и подготовка модели
tests/                    171 тест
.github/workflows/        CI
```

## 3. Код и коммиты

Код опубликован в `main`: https://github.com/alibekovbekbolat05-collab/Diplom

| Этап | Коммит |
|---|---|
| Публичный сайт | `8c1f6fd` — feat: complete localized public website and quality checks |
| Основа и ingest | `32a2b53` — feat: add authenticated console and normalized event ingestion |
| Детекторы | `422f2f3` — feat: add detectors rules correlation and live event stream |
| Python ML | `a5e1b5d` — feat: train Python flow model and add explainable ML triage |
| Консоль | `a826185` — feat: add live console event search and incident workflows |
| Администрирование | `fe38b41` — feat: complete rule file report and administration workflows |
| SEO и заголовки | `a59ddf5` — feat: add search metadata icons manifest and security headers |
| Итоговая проверка | `76c6f1e` — fix: verify localized workflows and harden platform security |
| Печать и передача | `7cfcd23` — fix: verify printable reports and document handover |

Полные файлы и история доступны в репозитории; схема API — [API.md](API.md).

## 4. Окружение

Шаблон: [.env.example](../.env.example). В production обязательны `AUTH_SECRET` (случайная строка минимум 32 символа), `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (bcrypt) и корректный `NEXT_PUBLIC_SITE_URL`. Опциональны `USERS_JSON`, `INGEST_TOKEN`, Redis, каналы уведомлений и LLM. Действительные пароли, токены и ключи не включены в git.

## 5. Запуск, GitHub, Vercel, вход

```sh
git clone https://github.com/alibekovbekbolat05-collab/Diplom.git
cd Diplom
npm ci
cp .env.example .env.local
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
node -e "console.log(require('bcryptjs').hashSync(process.argv[1],10))" 'YOUR_PASSWORD'
npm run dev -- -H 127.0.0.1
```

Сохраните сгенерированные значения в `.env.local`. Откройте `/ru` и `/ru/platform/login`. Вход администратора использует заданные вами email и пароль; кнопка демо создаёт сеанс наблюдателя. Хеш пароля не является паролем для формы.

GitHub подключён к проекту `diplom` команды `be-ka2`; коммиты в `main` автоматически деплоятся. Публичный адрес: [diplom-be-ka2.vercel.app](https://diplom-be-ka2.vercel.app/ru). Панель проекта: [Vercel](https://vercel.com/be-ka2/diplom). Для повторной настройки: Next.js, корень репозитория, Node 22, `npm ci`, `npm run build`, стандартная output directory, env для нужных окружений.

Production-деплой коммита `7cfcd23` завершён успешно: [запись Vercel](https://vercel.com/be-ka2/diplom/GgALgyDiLxFWKLMs4nr366tLvUNL). 10 октября 2026 проверены HTTP 200 для RU/EN/KK, страницы входа, `/api/health` и `/api/stats`; вход администратора с ранее заданными данными и защищённый `/api/overview` работают. `/api/health` подтверждает настроенную авторизацию и временное хранилище. Подключённый инструмент Vercel не имеет доступа к команде `be-ka2` (403), поэтому настройки панели через него не инспектировались; успешный деплой подтверждён GitHub Deployment Status и прямыми HTTPS-запросами.

## 6. Подключение интеграций

- Redis: `UPSTASH_REDIS_REST_URL` и `UPSTASH_REDIS_REST_TOKEN`; включает общее хранилище и распределённые лимиты.
- LLM: HTTPS `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`; только сводки, без raw logs и идентификаторов.
- Уведомления: Telegram bot/chat либо HTTPS webhook; новые реальные high/critical кейсы. Контактная форма требует Telegram.
- Агент: переменные из [agent/README.md](../agent/README.md); процесс запускается на машине с журналами, не в Vercel.
- Реальное обучение: [ml/README.md](../ml/README.md), официальный CIC-IDS2017 CSV и локальный preprocessing; текущие метрики синтетические.
- PostgreSQL: заменить store adapter транзакционными таблицами и миграциями; готового DB-подключения нет.
- Analytics: добавить провайдер и согласие на cookies; сейчас выключена.
- Live threat feeds: добавить плановое обновление с проверкой источника; сейчас используется датированный snapshot.
- Payments: добавить checkout, проверку webhook и права тарифов; сейчас выключены, карты не собираются.

## 7. Допущения

Компания и сведения диплома — редактируемые демонстрационные данные. Локальное `/tmp`-хранилище временное; нескольким инстансам нужен Redis. Карта/топология иллюстративны. ISO mapping ориентировочное. Модель обучена на синтетическом наборе, её самостоятельные алерты выключены до калибровки; вероятность влияет на triage. Рекомендации никогда не исполняются автоматически.

## 8. Самопроверка

✔ lint, typecheck, 171 тест, production build, 32 Python/TS fixture, 0 production dependency vulnerabilities.

✔ 24 публичных страницы; 99 сочетаний страниц консоли/языков/ролей; 8 форматов файлов; ingest → детектор → кейс → аудит; агент и отзыв токенов; XSS/CSV escaping; IPv6; пауза и автоматическое переподключение SSE; ширины 360/768/1280/1920; 0 ошибок браузера и CSP.

✔ Vercel production: автоматический деплой завершён, публичные страницы и API доступны, вход администратора и защищённый overview проверены.

✘ Внешние Redis/Telegram/LLM не проверялись без ключей; Lighthouse/INP/60 FPS не измерены. Эти цели не выдаются за достигнутые.

Подробные реальные результаты и ограничения: [VERIFICATION.md](VERIFICATION.md).
