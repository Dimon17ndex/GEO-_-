import type { Request, Response } from 'express'; // или импорты вашего фреймворка

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { password } = req.body || {};
    const SECRET_PASSWORD = process.env.CONSOLE_PASS || "console_dima_razrab";

    if (password === SECRET_PASSWORD) {
        return res.status(200).json({ success: true });
    } else {
        return res.status(401).json({ success: false, message: 'Неверный пароль' });
    }
}