import type { OutageSchedule } from "@shared/schema";
import { format, addDays, parse } from "date-fns";
import { fr } from "date-fns/locale";

function formatTime(timeSlot: number): string {
  const h = Math.floor(timeSlot);
  const m = timeSlot % 1 !== 0 ? '30' : '00';
  return `${h.toString().padStart(2, '0')}h${m}`;
}

function formatICalDateTime(dateStr: string, hour: number): { date: string; time: string } {
  const baseDate = parse(dateStr, "yyyy-MM-dd", new Date());
  const h = Math.floor(hour);
  const m = hour % 1 !== 0 ? 30 : 0;
  
  if (hour >= 24) {
    const nextDay = addDays(baseDate, 1);
    const adjustedHour = Math.floor(hour - 24);
    return {
      date: format(nextDay, "yyyyMMdd"),
      time: adjustedHour.toString().padStart(2, '0') + m.toString().padStart(2, '0') + '00'
    };
  }
  
  return {
    date: format(baseDate, "yyyyMMdd"),
    time: h.toString().padStart(2, '0') + m.toString().padStart(2, '0') + '00'
  };
}

export function generateICalEvent(schedule: OutageSchedule): string {
  const now = new Date();
  const dtstamp = format(now, "yyyyMMdd'T'HHmmss'Z'");
  
  let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Delestage Tana//Power Outage Schedule//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Délestage - ${schedule.neighborhood.name}
X-WR-TIMEZONE:Indian/Antananarivo
`;

  schedule.outages.forEach((outage, index) => {
    const start = formatICalDateTime(outage.date, outage.startHour);
    const end = formatICalDateTime(outage.date, outage.endHour);
    const uid = `${schedule.neighborhood.id}-${outage.date}-${index}@delestage-tana`;
    
    icalContent += `BEGIN:VEVENT
DTSTART;TZID=Indian/Antananarivo:${start.date}T${start.time}
DTEND;TZID=Indian/Antananarivo:${end.date}T${end.time}
DTSTAMP:${dtstamp}
UID:${uid}
SUMMARY:Coupure électricité - ${schedule.neighborhood.name}
DESCRIPTION:Délestage prévu de ${formatTime(outage.startHour)} à ${formatTime(outage.endHour)} dans le quartier ${schedule.neighborhood.name} (${schedule.neighborhood.district}).
LOCATION:${schedule.neighborhood.name}, ${schedule.neighborhood.district}, Antananarivo
STATUS:CONFIRMED
CATEGORIES:DELESTAGE,ELECTRICITY
END:VEVENT
`;
  });

  icalContent += `END:VCALENDAR`;
  return icalContent;
}

export function generateAllSchedulesICal(schedules: OutageSchedule[]): string {
  const now = new Date();
  const dtstamp = format(now, "yyyyMMdd'T'HHmmss'Z'");
  
  let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Delestage Tana//Power Outage Schedule//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Délestages Antananarivo
X-WR-TIMEZONE:Indian/Antananarivo
`;

  schedules.forEach((schedule) => {
    schedule.outages.forEach((outage, index) => {
      const start = formatICalDateTime(outage.date, outage.startHour);
      const end = formatICalDateTime(outage.date, outage.endHour);
      const uid = `${schedule.neighborhood.id}-${outage.date}-${index}@delestage-tana`;
      
      icalContent += `BEGIN:VEVENT
DTSTART;TZID=Indian/Antananarivo:${start.date}T${start.time}
DTEND;TZID=Indian/Antananarivo:${end.date}T${end.time}
DTSTAMP:${dtstamp}
UID:${uid}
SUMMARY:Coupure - ${schedule.neighborhood.name}
DESCRIPTION:Délestage prévu de ${formatTime(outage.startHour)} à ${formatTime(outage.endHour)} dans le quartier ${schedule.neighborhood.name} (${schedule.neighborhood.district}).
LOCATION:${schedule.neighborhood.name}, ${schedule.neighborhood.district}, Antananarivo
STATUS:CONFIRMED
CATEGORIES:DELESTAGE,ELECTRICITY
END:VEVENT
`;
    });
  });

  icalContent += `END:VCALENDAR`;
  return icalContent;
}

export function downloadICal(schedules: OutageSchedule[], filename?: string) {
  const content = generateAllSchedulesICal(schedules);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `delestage-tana-${format(new Date(), 'yyyy-MM-dd')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generatePDFContent(schedules: OutageSchedule[]): string {
  const today = new Date();
  const formattedDate = format(today, "EEEE d MMMM yyyy", { locale: fr });
  
  let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Délestages Antananarivo - ${formattedDate}</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      margin: 0; 
      padding: 20px;
      color: #2C3E50;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #E74C3C;
    }
    .header h1 { 
      color: #E74C3C; 
      margin: 0 0 5px 0;
      font-size: 24px;
    }
    .header .date { 
      color: #666; 
      font-size: 14px;
    }
    .district-section {
      margin-bottom: 25px;
    }
    .district-title {
      background: #2C3E50;
      color: white;
      padding: 8px 15px;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .neighborhood-row {
      display: flex;
      align-items: center;
      padding: 10px 15px;
      border-bottom: 1px solid #eee;
    }
    .neighborhood-row:last-child {
      border-bottom: none;
    }
    .neighborhood-name {
      flex: 1;
      font-weight: 500;
    }
    .outage-times {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .outage-badge {
      background: #E74C3C;
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .active-badge {
      background: #27AE60;
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .legend {
      display: flex;
      gap: 20px;
      justify-content: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }
    .legend-box {
      width: 16px;
      height: 16px;
      border-radius: 3px;
    }
    .legend-outage { background: #E74C3C; }
    .legend-active { background: #27AE60; }
    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 11px;
      color: #999;
    }
    @media print {
      body { padding: 10mm; }
      .district-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Délestages Antananarivo</h1>
    <div class="date">${formattedDate}</div>
  </div>
`;

  const districts = new Map<string, typeof schedules>();
  schedules.forEach(schedule => {
    const district = schedule.neighborhood.district;
    if (!districts.has(district)) {
      districts.set(district, []);
    }
    districts.get(district)!.push(schedule);
  });

  districts.forEach((districtSchedules, districtName) => {
    html += `
  <div class="district-section">
    <div class="district-title">${districtName}</div>
`;
    
    districtSchedules
      .sort((a, b) => a.neighborhood.name.localeCompare(b.neighborhood.name))
      .forEach(schedule => {
        html += `
    <div class="neighborhood-row">
      <div class="neighborhood-name">${schedule.neighborhood.name}</div>
      <div class="outage-times">
`;
        if (schedule.outages.length === 0) {
          html += `        <span class="active-badge">Pas de coupure</span>\n`;
        } else {
          schedule.outages.forEach(outage => {
            html += `        <span class="outage-badge">${formatTime(outage.startHour)} - ${formatTime(outage.endHour)}</span>\n`;
          });
        }
        html += `
      </div>
    </div>
`;
      });

    html += `  </div>\n`;
  });

  html += `
  <div class="legend">
    <div class="legend-item">
      <div class="legend-box legend-outage"></div>
      <span>Coupure prévue</span>
    </div>
    <div class="legend-item">
      <div class="legend-box legend-active"></div>
      <span>Électricité active</span>
    </div>
  </div>
  <div class="footer">
    <p>Généré par Délestage Tana • Les horaires sont indicatifs et peuvent varier</p>
  </div>
</body>
</html>
`;

  return html;
}

export function downloadPDF(schedules: OutageSchedule[]) {
  const content = generatePDFContent(schedules);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
