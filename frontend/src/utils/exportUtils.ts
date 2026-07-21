import * as XLSX from 'xlsx';

interface ExportableSlot {
  day: number;
  period: number;
  Subject?: { name: string };
  Teacher?: { User?: { fullName: string } };
  ClassGroup?: { name: string };
  room?: string;
}

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export const exportToExcel = (schedule: ExportableSlot[], fileName = 'schedule.xlsx') => {
  const rows: (string | number)[][] = [['Урок', ...DAY_LABELS]];

  for (const period of PERIODS) {
    const row: (string | number)[] = [period];
    for (let day = 0; day < DAY_LABELS.length; day++) {
      const slots = schedule.filter((s) => s.period === period && s.day === day);
      if (slots.length) {
        const cellText = slots.map((slot) => {
          const parts = [
            slot.Subject?.name,
            slot.Teacher?.User?.fullName,
            slot.ClassGroup?.name,
            slot.room ? `каб. ${slot.room}` : undefined,
          ].filter(Boolean);
          return parts.join(' / ');
        }).join('\n\n');
        row.push(cellText);
      } else {
        row.push('');
      }
    }
    rows.push(row);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 8 }, ...DAY_LABELS.map(() => ({ wch: 28 }))];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Розклад');
  XLSX.writeFile(workbook, fileName);
};