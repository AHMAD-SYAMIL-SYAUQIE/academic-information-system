import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { kelasUuid: string } }) {
  try {
    // Ambil parameter dari request Next.js
    const kelasUuid = params.kelasUuid;
    const searchParams = request.nextUrl.searchParams;
    const mapelUuid = searchParams.get('mapelUuid');
    const role = searchParams.get('role');

    // Bangun URL dengan query parameter yang relevan
    const pdfServerUrl = new URL(`http://localhost:4000/api/laporan/export/nilai/pdf/${kelasUuid}`);
    if (mapelUuid) {
      pdfServerUrl.searchParams.append('mapelUuid', mapelUuid);
    }
    if (role) {
      pdfServerUrl.searchParams.append('role', role);
    }
    
    // Teruskan request ke server PDF mandiri
    const pdfResponse = await fetch(pdfServerUrl.toString());

    if (!pdfResponse.ok) {
      const errorBody = await pdfResponse.json();
      return NextResponse.json(errorBody, { status: pdfResponse.status });
    }

    // Ambil PDF sebagai stream dan teruskan ke client
    const blob = await pdfResponse.blob();
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename=rekap-nilai-${Date.now()}.pdf`);

    return new NextResponse(blob, { status: 200, headers });

  } catch (error) {
    console.error('Error proxying to PDF server:', error);
    return NextResponse.json({ message: 'Gagal menghubungi server PDF.' }, { status: 500 });
  }
}