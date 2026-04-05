import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, where, addDoc, serverTimestamp } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

export async function GET() {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('name'));
    const snapshot = await getDocs(q);
    
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        created_at: data.created_at
      };
    });

    return NextResponse.json(users);
  } catch (error: any) {
    // Fallback if index for orderBy('name') is missing
    if (error.message.includes('index')) {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          email: data.email,
          role: data.role,
          created_at: data.created_at
        };
      }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return NextResponse.json(users);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }
  try {
    const { name, email, password, role } = await request.json();
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUserRef = await addDoc(usersRef, {
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      created_at: serverTimestamp()
    });

    return NextResponse.json({
      id: newUserRef.id,
      name,
      email,
      role: role || 'user'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
