export default async function handler(req: any, res: any) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body;

    // Парсим body, если он пришел строкой
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const { password } = body || {};

    if (!password) {
      return res.status(400).json({ success: false, error: 'Пароль не указан' });
    }

    // Очищаем введенный пароль от пробелов
    const cleanPassword = String(password).trim();

    // Прямая проверка пароля
    if (cleanPassword === '489634') {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ success: false, error: 'Неверный пароль' });
    }

  } catch (err: any) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

