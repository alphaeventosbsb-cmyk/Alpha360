import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }
  try {
    const { id } = await params;
    const data = await request.json();
    
    const updateData: any = { ...data };
    
    if (data.siteIcon !== undefined) {
      updateData.site_icon = data.siteIcon;
      delete updateData.siteIcon;
    }

    const guardRef = doc(db, 'guards', id);
    await updateDoc(guardRef, updateData);

    const updatedDoc = await getDoc(guardRef);
    const updatedData = updatedDoc.data() || {};
    
    return NextResponse.json({ 
      id: updatedDoc.id, 
      ...updatedData,
      siteIcon: updatedData.site_icon
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }
  try {
    const { id } = await params;
    
    await deleteDoc(doc(db, 'guards', id));

    return NextResponse.json({ success: true, message: `Guarda ${id} excluído com sucesso.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
