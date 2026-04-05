import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }
  try {
    const { id } = await params;
    
    await deleteDoc(doc(db, 'users', id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
