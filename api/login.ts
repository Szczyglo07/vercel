import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Brak danych' });

  try {
    const [user] = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (!user) return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });

    // JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(200).json({ message: 'Zalogowano', token });
  } catch {
    res.status(500).json({ message: 'Błąd serwera' });
  }
}
