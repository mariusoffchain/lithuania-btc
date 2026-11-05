// RFC 5545 text escaping and UTF-8 line folding; date-only events use exclusive DTEND.
export function calendarEvent(event, language = 'en', origin = 'https://cypherbaltics.org', name = 'Cypher Baltics') {
  if (event.status === 'planned' || event.dateUncertain || !event.start || !Number.isFinite(Date.parse(event.start))) throw Error('Event date is not confirmed');
  const end = event.end || event.start;
  if (!Number.isFinite(Date.parse(end)) || Date.parse(end) < Date.parse(event.start)) throw Error('Invalid event end');
  const esc = value => String(value ?? '').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const stamp = value => new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const day = value => String(value).slice(0,10).replaceAll('-','');
  const allDay = event.dateOnly || /^\d{4}-\d{2}-\d{2}$/.test(event.start);
  const nextDay = new Date(String(end).slice(0,10)+'T00:00:00Z');nextDay.setUTCDate(nextDay.getUTCDate()+1);
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//'+name+'//Calendar//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+esc(event.id)+'@'+new URL(origin).hostname,'DTSTAMP:'+stamp(new Date()),allDay?'DTSTART;VALUE=DATE:'+day(event.start):'DTSTART:'+stamp(event.start),...(allDay?['DTEND;VALUE=DATE:'+day(nextDay.toISOString())]:event.end?['DTEND:'+stamp(event.end)]:[]),'SUMMARY:'+esc(event.title?.[language]||event.title?.en||event.title), 'LOCATION:'+esc([...new Set([event.venue,event.address].filter(Boolean))].join(', ')),'DESCRIPTION:'+esc(event.description?.[language]||event.description?.en||''),'END:VEVENT','END:VCALENDAR',''];
  return lines.map(line=>{let folded='',length=0;for(const char of line){const bytes=new TextEncoder().encode(char).length;if(length+bytes>75){folded+='\r\n ';length=1;}folded+=char;length+=bytes;}return folded;}).join('\r\n');
}
