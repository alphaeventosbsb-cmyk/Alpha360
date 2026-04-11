import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

export async function GET() {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }
  try {
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    
    const mappedData = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        clientName: data.client_name,
        startTime: data.start_time,
        endTime: data.end_time,
        dailyRate: data.daily_rate,
        guardsCount: data.guards_count,
        hasQRF: data.has_qrf,
        hasHydration: data.has_hydration,
      };
    });

    return NextResponse.json(mappedData);
  } catch (error: any) {
    // Fallback if index for orderBy('created_at', 'desc') is missing
    if (error.message.includes('index')) {
      const jobsRef = collection(db, 'jobs');
      const snapshot = await getDocs(jobsRef);
      const mappedData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          clientName: data.client_name,
          startTime: data.start_time,
          endTime: data.end_time,
          dailyRate: data.daily_rate,
          guardsCount: data.guards_count,
          hasQRF: data.has_qrf,
          hasHydration: data.has_hydration,
        };
      }).sort((a: any, b: any) => {
        const dateA = a.created_at?.toMillis ? a.created_at.toMillis() : 0;
        const dateB = b.created_at?.toMillis ? b.created_at.toMillis() : 0;
        return dateB - dateA;
      });
      return NextResponse.json(mappedData);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }
  try {
    const job = await request.json();
    
    const jobData = {
      client_name: job.clientName,
      date: job.date,
      start_time: job.startTime,
      end_time: job.endTime,
      daily_rate: job.dailyRate,
      guards_count: job.guardsCount,
      location: job.location,
      has_qrf: job.hasQRF,
      has_hydration: job.hasHydration,
      status: 'open',
      created_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'jobs'), jobData);

    return NextResponse.json({
      id: docRef.id,
      ...jobData,
      clientName: jobData.client_name,
      startTime: jobData.start_time,
      endTime: jobData.end_time,
      dailyRate: jobData.daily_rate,
      guardsCount: jobData.guards_count,
      hasQRF: jobData.has_qrf,
      hasHydration: jobData.has_hydration,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
