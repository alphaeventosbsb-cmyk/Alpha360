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
    const job = await request.json();
    
    const updateData: any = { ...job };
    
    // Mapear camelCase para snake_case se necessário para o banco
    if (job.clientName !== undefined) {
      updateData.client_name = job.clientName;
      delete updateData.clientName;
    }
    if (job.startTime !== undefined) {
      updateData.start_time = job.startTime;
      delete updateData.startTime;
    }
    if (job.endTime !== undefined) {
      updateData.end_time = job.endTime;
      delete updateData.endTime;
    }
    if (job.dailyRate !== undefined) {
      updateData.daily_rate = job.dailyRate;
      delete updateData.dailyRate;
    }
    if (job.guardsCount !== undefined) {
      updateData.guards_count = job.guardsCount;
      delete updateData.guardsCount;
    }
    if (job.hasQRF !== undefined) {
      updateData.has_qrf = job.hasQRF;
      delete updateData.hasQRF;
    }
    if (job.hasHydration !== undefined) {
      updateData.has_hydration = job.hasHydration;
      delete updateData.hasHydration;
    }

    const jobRef = doc(db, 'jobs', id);
    await updateDoc(jobRef, updateData);

    // Busca o documento atualizado para retornar
    const updatedDoc = await getDoc(jobRef);
    const data = updatedDoc.data() || {};
    
    return NextResponse.json({ 
      id: updatedDoc.id, 
      ...data,
      clientName: data.client_name,
      startTime: data.start_time,
      endTime: data.end_time,
      dailyRate: data.daily_rate,
      guardsCount: data.guards_count,
      hasQRF: data.has_qrf,
      hasHydration: data.has_hydration,
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
    
    await deleteDoc(doc(db, 'jobs', id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
