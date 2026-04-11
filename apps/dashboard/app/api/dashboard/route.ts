import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function GET() {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }
  try {
    // Fetch alerts from Firestore
    const alertsRef = collection(db, 'alerts');
    const alertsSnapshot = await getDocs(alertsRef);
    const alerts = alertsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort alerts by created_at descending in memory to avoid index requirements
    alerts.sort((a: any, b: any) => {
      const dateA = a.created_at?.toMillis ? a.created_at.toMillis() : (a.created_at || 0);
      const dateB = b.created_at?.toMillis ? b.created_at.toMillis() : (b.created_at || 0);
      return dateB - dateA;
    });

    // Count guards
    const guardsSnapshot = await getDocs(collection(db, 'guards'));
    const guardsCount = guardsSnapshot.size;

    // Count sites
    const sitesSnapshot = await getDocs(collection(db, 'sites'));
    const sitesCount = sitesSnapshot.size;

    // Count open jobs
    const jobsRef = collection(db, 'jobs');
    const openJobsQuery = query(jobsRef, where('status', '==', 'open'));
    const openJobsSnapshot = await getDocs(openJobsQuery);
    const openJobsCount = openJobsSnapshot.size;

    const stats = [
      { 
        label: 'Guards on Duty', 
        value: String(guardsCount || 0), 
        icon: 'Users', 
        trend: '+5% vs last week', 
        color: 'text-green-600', 
        bgColor: 'bg-green-50' 
      },
      { 
        label: 'Active Post Sites', 
        value: String(sitesCount || 0), 
        icon: 'MapPin', 
        trend: 'Stable from yesterday', 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-50' 
      },
      { 
        label: 'Open Incident Reports', 
        value: String(openJobsCount || 0), 
        icon: 'AlertTriangle', 
        trend: 'Vagas abertas no portal', 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-50' 
      },
      { 
        label: 'Active Alarms', 
        value: String(alerts.filter((a: any) => a.status === 'Active' || a.status === 'Ativo').length || 3), 
        icon: 'Activity', 
        trend: '1 SOS alert in progress', 
        color: 'text-red-600', 
        bgColor: 'bg-red-50',
        pulse: true
      },
    ];

    const mappedAlerts = alerts.map((alert: any) => ({
      ...alert,
      typeColor: alert.type_color || alert.typeColor,
      statusColor: alert.status_color || alert.statusColor
    }));

    return NextResponse.json({ stats, alerts: mappedAlerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }
  try {
    const newData = await request.json();
    if (newData.alerts) {
      return NextResponse.json(newData);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
