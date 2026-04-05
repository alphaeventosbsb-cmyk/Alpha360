import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function GET() {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }
  try {
    const guardsRef = collection(db, 'guards');
    const snapshot = await getDocs(guardsRef);
    
    const mappedData = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        siteIcon: data.site_icon,
      };
    });

    return NextResponse.json(mappedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }
  try {
    const data = await request.json();
    const guardId = data.id || `GRD-${Math.floor(100 + Math.random() * 900)}`;
    
    const guardData = {
      ...data,
      id: guardId,
      site_icon: data.siteIcon || 'business',
      status: data.status || 'Offline',
      performance: data.performance || 100,
      created_at: serverTimestamp()
    };
    
    // Remove camelCase fields se existirem
    if ('siteIcon' in guardData) delete guardData.siteIcon;

    await setDoc(doc(db, 'guards', guardId), guardData);

    return NextResponse.json({
      ...guardData,
      siteIcon: guardData.site_icon
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
