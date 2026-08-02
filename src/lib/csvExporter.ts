import { PortalEvent } from '../types';

/**
 * Escapes strings for CSV formatting
 */
function escapeCsvCell(cell: string | number | boolean | undefined | null): string {
  if (cell === undefined || cell === null) return '""';
  const str = String(cell);
  // Replace double quotes with double-double quotes
  const escaped = str.replace(/"/g, '""');
  // Wrap in double quotes
  return `"${escaped}"`;
}

/**
 * Exports an array of PortalEvent items to a CSV file and triggers browser download
 */
export function exportEventsToCsv(events: PortalEvent[], customFilename?: string): void {
  if (!events || events.length === 0) {
    alert('Nenhum evento para exportar.');
    return;
  }

  const headers = [
    'ID Evento',
    'Data e Hora',
    'Timestamp (ms)',
    'Dispositivo',
    'ID Dispositivo',
    'Aplicativo',
    'Tipo',
    'Prioridade',
    'Remetente',
    'Título',
    'Mensagem / Conteúdo',
    'Lido',
    'Favorito'
  ];

  const rows = events.map((e) => {
    const rawTs = typeof e.timestamp === 'number' ? e.timestamp : Date.parse(String(e.timestamp)) || Date.now();
    const formattedDate = new Date(rawTs).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return [
      escapeCsvCell(e.id),
      escapeCsvCell(formattedDate),
      escapeCsvCell(rawTs),
      escapeCsvCell(e.deviceName || 'Desconhecido'),
      escapeCsvCell(e.deviceId || ''),
      escapeCsvCell(e.app || e.source || 'N/A'),
      escapeCsvCell(e.type || 'notification'),
      escapeCsvCell(e.priority || 'normal'),
      escapeCsvCell(e.sender || ''),
      escapeCsvCell(e.title || ''),
      escapeCsvCell(e.body || e.text || ''),
      escapeCsvCell(e.read ? 'Sim' : 'Não'),
      escapeCsvCell(e.favorite ? 'Sim' : 'Não')
    ].join(';'); // Using semicolon (;) which is standard for Excel in Portuguese/European locale
  });

  // UTF-8 Byte Order Mark (BOM) to ensure correct character encoding in Excel
  const bom = '\uFEFF';
  const csvContent = bom + [headers.map(escapeCsvCell).join(';'), ...rows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = customFilename || `portal_events_export_${dateStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
