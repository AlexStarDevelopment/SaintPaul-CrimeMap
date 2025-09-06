import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDashboardDataForAddress } from '@/lib/services/crimeData';
// @ts-ignore
import PDFDocument from 'pdfkit';

type DashboardData = {
  address: string;
  totalIncidents: number;
  safetyScore: number;
  incidents: Array<{ type: string; date: string; location: string }>;
};

export async function POST(request: NextRequest) {
  // Only pro users can export
  const session = await getServerSession(authOptions);
  if (!session || session.user.subscriptionTier !== 'pro') {
    return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
  }

  // Receive all dashboard data from the frontend
  const data = await request.json();
  const { address, totalIncidents, safetyScore, incidents } = data;
  if (!address || !incidents) {
    return NextResponse.json({ error: 'Missing dashboard data' }, { status: 400 });
  }

  // Create PDF
  const doc = new PDFDocument({ margin: 40 });
  let buffers: Buffer[] = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});

  // Professional layout
  doc.fontSize(20).text('Crime Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Address: ${address}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  // Summary stats
  doc.fontSize(16).text('Summary', { underline: true });
  doc.fontSize(12).text(`Total Incidents: ${totalIncidents}`);
  doc.text(`Safety Score: ${safetyScore}`);
  doc.moveDown();

  // Recent incidents table
  doc.fontSize(16).text('Recent Incidents', { underline: true });
  incidents.slice(0, 10).forEach((incident: any, idx: number) => {
    doc
      .fontSize(12)
      .text(`${idx + 1}. ${incident.type} on ${incident.date} at ${incident.location}`);
  });
  doc.moveDown();

  // Branding and footer
  doc.fontSize(10).text('Saint Paul CrimeMap | Generated for sharing', { align: 'center' });
  doc.text('For more details, visit: https://saintpaul-crimemap.com', { align: 'center' });

  doc.end();
  const pdfBuffer = Buffer.concat(buffers);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="crime-report-${address}.pdf"`,
    },
  });
}
