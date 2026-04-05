import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function GET() {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }
  try {
    const sitesRef = collection(db, 'sites');
    const q = query(sitesRef, orderBy('name'));
    const snapshot = await getDocs(q);
    
    const mappedData = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        guardsCount: data.guards_count,
        lastAudit: data.last_audit
      };
    });

    return NextResponse.json(mappedData);
  } catch (error: any) {
    // Fallback if index for orderBy('name') is missing
    if (error.message.includes('index')) {
      const sitesRef = collection(db, 'sites');
      const snapshot = await getDocs(sitesRef);
      const mappedData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          guardsCount: data.guards_count,
          lastAudit: data.last_audit
        };
      }).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
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
    const newSite = await request.json();
    
    if (!newSite.id) {
      newSite.id = `S-${Math.floor(100 + Math.random() * 900)}`;
    }
    
    const siteData = {
      name: newSite.name,
      address: newSite.address,
      client: newSite.client,
      guards_count: newSite.guardsCount || 0,
      status: newSite.status || 'Ativo',
      last_audit: newSite.lastAudit || null,
      image: newSite.image || `https://picsum.photos/seed/${newSite.id}/400/300`,
      created_at: serverTimestamp()
    };

    // Usamos setDoc para poder definir o ID customizado (ex: S-123)
    await setDoc(doc(db, 'sites', newSite.id), siteData);

    return NextResponse.json({
      id: newSite.id,
      ...siteData,
      guardsCount: siteData.guards_count,
      lastAudit: siteData.last_audit
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
