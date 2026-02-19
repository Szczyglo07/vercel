import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ message: 'Brak danych' });
  if (password.length < 6) return res.status(400).json({ message: 'Hasło min. 6 znaków' });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomUUID();

    await sql`
      INSERT INTO users (
        email, password_hash, verification_token, is_admin
      ) VALUES (
        ${email}, ${passwordHash}, ${verificationToken}, false
      )
    `;

    // 🔜 w przyszłości: wysyłka emaila z linkiem
    res.status(201).json({ message: 'Konto utworzone. Sprawdź email, aby je aktywować.' });
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ message: 'Email już istnieje' });
    res.status(500).json({ message: 'Błąd serwera' });
  }
}
