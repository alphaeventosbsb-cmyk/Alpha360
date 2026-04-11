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
    const site = await request.json();
    
    const updateData: any = { ...site };
    if (site.guardsCount !== undefined) {
      updateData.guards_count = site.guardsCount;
      delete updateData.guardsCount;
    }
    if (site.lastAudit) {
      updateData.last_audit = site.lastAudit;
      delete updateData.lastAudit;
    }

    const siteRef = doc(db, 'sites', id);
    await updateDoc(siteRef, updateData);

    // Busca o documento atualizado para retornar
    const updatedDoc = await getDoc(siteRef);
    
    return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });
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
    
    await deleteDoc(doc(db, 'sites', id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
