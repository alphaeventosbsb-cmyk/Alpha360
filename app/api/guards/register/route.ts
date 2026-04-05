import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }
  try {
    const { name, age, cpf, rg, address, height, phone, email } = await request.json();

    if (!name || !age || !cpf || !rg || !address || !height) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 });
    }

    const guardId = `G-${Math.floor(100 + Math.random() * 900)}`;

    const guardData = {
      id: guardId,
      name,
      rank: 'Júnior',
      phone: phone || null,
      email: email || null,
      age: Number(age),
      cpf,
      rg,
      address,
      height: Number(height),
      site: '',
      site_icon: 'business',
      status: 'Offline',
      performance: 0,
      image: 'https://picsum.photos/200',
      created_at: serverTimestamp()
    };

    await setDoc(doc(db, 'guards', guardId), guardData);

    return NextResponse.json({ success: true, guard: guardData });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao cadastrar' }, { status: 500 });
  }
}
