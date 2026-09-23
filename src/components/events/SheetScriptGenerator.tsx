import React, { useMemo, useState } from 'react';

interface SheetScriptGeneratorProps {
  teamBased: boolean;
  requiresEmail: boolean;
  hasFee: boolean;
  sendEmail: boolean;
  siteUrl?: string;
}

/**
 * Builds a Google Apps Script tailored to one event's settings, plus the
 * exact sheet column headers it will write.
 *
 * The script does two jobs, told apart by an `action` field in the POST
 * body:
 *  - action "register" (or missing) records a new registration.
 *  - action "attendance" is what the coordinator's QR scanner sends —
 *    it ticks someone off on the sheet itself, not just in the app.
 *
 * Team events use ONE row per team rather than one per person: every
 * member's name is appended into a single "Team Members" cell as they
 * register (whether that's the leader registering everyone up front, or
 * each teammate joining later via the invite link — either way lands in
 * the same row, matched by a hidden Team ID). Attendance works the same
 * way: scanning a teammate's ticket appends just their name into
 * "Attended Members", so you can see at a glance who from the team
 * actually showed up.
 *
 * Columns and code are generated (not fixed) because they depend on what
 * the coordinator turned on: an event that doesn't collect emails can't
 * send tickets by email, and so on.
 */
const buildColumns = (o: SheetScriptGeneratorProps): string[] => {
  if (o.teamBased) {
    const cols = ['Registered At', 'Team Name', 'Team Members'];
    if (o.requiresEmail || o.sendEmail) cols.push('Emails');
    if (o.hasFee) cols.push('Fee', 'Payment Status', 'Payment Ref (UTR)');
    cols.push('Attended Members');
    cols.push('Team ID', 'Registration IDs'); // helper columns — safe to hide, not to delete
    if (o.sendEmail) cols.push('Email Status');
    return cols;
  }
  const cols = ['Registered At', 'Name'];
  if (o.requiresEmail || o.sendEmail) cols.push('Email');
  cols.push('Reg No', 'Department');
  if (o.hasFee) cols.push('Fee', 'Payment Status', 'Payment Ref (UTR)');
  cols.push('Registration ID', 'Attended');
  if (o.sendEmail) cols.push('Email Status');
  return cols;
};

const sharedHeaderComment = (o: SheetScriptGeneratorProps) => `/**
 * SIMATS SeatSync — registration + attendance logger for this event.
 * Generated for your current event settings${o.teamBased ? ' (team event — one row per team, not per person)' : ''}${
   o.sendEmail ? ' with ticket emails enabled' : ''
 }${o.hasFee ? ', paid event' : ''}.
 *
 * SETUP
 * 1. Open your Google Sheet -> Extensions -> Apps Script.
 * 2. Delete everything in Code.gs and paste this in.${
   o.sendEmail ? `\n * 3. Check SITE_URL below is your real site address.` : ''
 }
 * ${o.sendEmail ? '4' : '3'}. Deploy -> New deployment -> type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 * ${o.sendEmail ? '5' : '4'}. Authorize when prompted${
   o.sendEmail ? ' (Gmail permission is needed to send the tickets)' : ''
 }.
 * ${o.sendEmail ? '6' : '5'}. Copy the Web App URL and paste it into the
 *    "Google Sheet Webhook URL" field on the event form.
 *
 * The header row is written automatically on the first registration, so
 * you can leave the sheet completely empty.
 *${o.teamBased ? `
 * "Team ID" and "Registration IDs" are working columns the script needs
 * to find the right row again later (when a teammate joins, or when
 * someone's ticket gets scanned) — you can hide them if you like, but
 * don't delete them or future updates for that team will stop matching.
 *` : ''}
 * TROUBLESHOOTING A BLANK COLUMN:
 * If one column comes through blank while the others are fine, it is
 * almost always one of these two things, in order of likelihood:
 *  1. You edited this script after deploying, but only saved — you must
 *     also go to Deploy -> Manage deployments -> the pencil icon -> New
 *     version, or the site keeps talking to your OLD code forever. The
 *     Web App URL stays the same either way, which is what makes this
 *     easy to miss.
 *  2. Check Executions (left sidebar, the clock icon) after a test
 *     registration and open the run — it shows the exact JSON this
 *     script received, so you can see whether the field actually
 *     arrived empty or wasn't sent at all.
 *
 * If you edit this script later, always deploy a NEW VERSION (see above)
 * for the change to take effect.
 */`;

const sharedEmailBlock = (o: SheetScriptGeneratorProps) =>
  o.sendEmail
    ? `
/**
 * Emails the participant a link to their ticket. Free quota is roughly
 * 100 recipients/day on a personal Gmail account and 1,500/day on Google
 * Workspace. A failure here never affects the registration itself — the
 * reason is just written into the "Email Status" column.
 */
function sendTicketEmail(data) {
  try {
    var ticketUrl = SITE_URL + '/ticket/' + data.registration_id;
    var name = data.participant_name || 'there';
${
  o.teamBased
    ? `    var teamLine = data.team_name
      ? '<p style="margin:0 0 20px;font-size:14px;color:#5E6C84">Team: <strong>' + escapeHtml(data.team_name) + '</strong>' + (data.is_leader ? ' (Team Leader)' : '') + '</p>'
      : '';
`
    : `    var teamLine = '';
`
}
    var html =
      '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1D1D1F">' +
        '<h2 style="margin:0 0 4px;font-size:22px">You are registered</h2>' +
        '<p style="margin:0 0 20px;color:#5E6C84;font-size:15px">Hi ' + escapeHtml(name) + ', your seat is confirmed.</p>' +
        teamLine +
        '<a href="' + ticketUrl + '" style="display:inline-block;background:#1D1D1F;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:999px;font-size:15px">View &amp; Download Ticket</a>' +
        '<p style="margin:24px 0 0;font-size:13px;color:#86868B">Or open this link:<br>' + ticketUrl + '</p>' +
      '</div>';

    MailApp.sendEmail({
      to: data.participant_email,
      subject: 'Your ticket is ready',
      htmlBody: html,
      name: 'SIMATS SeatSync'
    });
    return 'Sent';
  } catch (err) {
    return 'Failed: ' + err.message;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
`
    : '';

const sharedConfigBlock = (o: SheetScriptGeneratorProps) =>
  o.sendEmail
    ? `// --- CONFIGURE ---------------------------------------------
// Your deployed site URL, with no trailing slash.
var SITE_URL = '${o.siteUrl || 'https://your-site-url.com'}';
// -----------------------------------------------------------
`
    : '';

// ── Solo events: unchanged one-row-per-registration design ──────────
const buildSoloScript = (o: SheetScriptGeneratorProps): string => {
  const cols = buildColumns(o);
  const headerLine = cols.map((c) => `'${c}'`).join(', ');
  const attendedColIndex = cols.indexOf('Attended') + 1; // 1-based for getRange
  const regIdColIndex = cols.indexOf('Registration ID') + 1;

  const rowParts: string[] = [
    `      data.registered_at || new Date().toISOString(),`,
    `      data.participant_name || '',`,
  ];
  if (o.requiresEmail || o.sendEmail) rowParts.push(`      data.participant_email || '',`);
  rowParts.push(`      data.reg_no || '',`);
  rowParts.push(`      data.department || '',`);
  if (o.hasFee) {
    rowParts.push(`      data.payment_amount || '',`);
    rowParts.push(`      data.payment_status || '',`);
    rowParts.push(`      data.payment_utr || '',`);
  }
  rowParts.push(`      data.registration_id || '',`);
  rowParts.push(`      '' /* Attended — filled in later by the QR scanner */${o.sendEmail ? ',' : ''}`);
  if (o.sendEmail) rowParts.push(`      emailStatus`);

  const emailStatusCalc = o.sendEmail
    ? `
    var emailStatus = 'Not sent';
    if (data.participant_email) {
      emailStatus = sendTicketEmail(data);
    } else {
      emailStatus = 'No email address';
    }
`
    : '';

  return `${sharedHeaderComment(o)}

${sharedConfigBlock(o)}
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    if (data.action === 'attendance') {
      return markAttendance(sheet, data);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([${headerLine}]);
    }
${emailStatusCalc}
    sheet.appendRow([
${rowParts.join('\n')}
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Finds the row whose Registration ID matches and writes "Yes" into its
 * Attended column. A short lock prevents two near-simultaneous scans
 * from corrupting each other's row lookup.
 */
function markAttendance(sheet, data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var values = sheet.getDataRange().getValues();
    var regIdCol = ${regIdColIndex - 1}; // 0-based
    for (var row = 1; row < values.length; row++) {
      if (values[row][regIdCol] === data.registration_id) {
        sheet.getRange(row + 1, ${attendedColIndex}).setValue('Yes');
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'ok', found: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', found: false }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
${sharedEmailBlock(o)}`;
};

// ── Team events: one consolidated row per team ───────────────────────
const buildTeamScript = (o: SheetScriptGeneratorProps): string => {
  const cols = buildColumns(o);
  const idx = (name: string) => cols.indexOf(name); // 0-based, used directly as array index
  const membersCol = idx('Team Members');
  const emailsCol = o.requiresEmail || o.sendEmail ? idx('Emails') : -1;
  const teamIdCol = idx('Team ID');
  const regIdsCol = idx('Registration IDs');
  const attendedCol = idx('Attended Members');
  const emailStatusCol = o.sendEmail ? idx('Email Status') : -1;
  const headerLine = cols.map((c) => `'${c}'`).join(', ');

  const newRowParts: string[] = [
    `        data.registered_at || new Date().toISOString(),`,
    `        data.team_name || '',`,
    `        data.participant_name || '',`,
  ];
  if (emailsCol >= 0) newRowParts.push(`        data.participant_email || '',`);
  if (o.hasFee) {
    newRowParts.push(`        data.payment_amount || '',`);
    newRowParts.push(`        data.payment_status || '',`);
    newRowParts.push(`        data.payment_utr || '',`);
  }
  newRowParts.push(`        '' /* Attended Members — filled in by the QR scanner */,`);
  newRowParts.push(`        data.team_id || '',`);
  newRowParts.push(`        data.registration_id + '::' + (data.participant_name || '')${emailStatusCol >= 0 ? ',' : ''}`);
  if (emailStatusCol >= 0) newRowParts.push(`        emailStatus`);

  const emailStatusCalc = o.sendEmail
    ? `
    var emailStatus = 'Not sent';
    if (data.participant_email) {
      emailStatus = sendTicketEmail(data);
    } else {
      emailStatus = 'No email address';
    }
`
    : '';

  return `${sharedHeaderComment(o)}

${sharedConfigBlock(o)}
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    if (data.action === 'attendance') {
      return markAttendance(sheet, data);
    }

    return upsertTeamMember(sheet, data);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Every member of a team lands in the SAME row, found by Team ID — the
 * leader registering everyone up front and a teammate joining later via
 * the invite link both end up here. A short lock stops two people
 * finishing registration at the same moment from overwriting each
 * other's update to that row.
 */
function upsertTeamMember(sheet, data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([${headerLine}]);
    }
${emailStatusCalc}
    var values = sheet.getDataRange().getValues();
    for (var row = 1; row < values.length; row++) {
      if (values[row][${teamIdCol}] === data.team_id) {
        var existingMembers = values[row][${membersCol}] || '';
        sheet.getRange(row + 1, ${membersCol + 1}).setValue(
          existingMembers ? existingMembers + ', ' + (data.participant_name || '') : (data.participant_name || '')
        );
${
  emailsCol >= 0
    ? `        var existingEmails = values[row][${emailsCol}] || '';
        sheet.getRange(row + 1, ${emailsCol + 1}).setValue(
          existingEmails ? existingEmails + ', ' + (data.participant_email || '') : (data.participant_email || '')
        );
`
    : ''
}        var existingIds = values[row][${regIdsCol}] || '';
        var newIdEntry = data.registration_id + '::' + (data.participant_name || '');
        sheet.getRange(row + 1, ${regIdsCol + 1}).setValue(
          existingIds ? existingIds + '|' + newIdEntry : newIdEntry
        );
${
  emailStatusCol >= 0
    ? `        var existingStatus = values[row][${emailStatusCol}] || '';
        sheet.getRange(row + 1, ${emailStatusCol + 1}).setValue(
          existingStatus ? existingStatus + ', ' + emailStatus : emailStatus
        );
`
    : ''
}        return ContentService
          .createTextOutput(JSON.stringify({ status: 'ok', merged: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // First member of this team (usually the leader) — start a new row.
    sheet.appendRow([
${newRowParts.join('\n')}
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', merged: false }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Scanning one teammate's ticket only ticks that person, not the whole
 * team: it searches every row's "Registration IDs" cell (a pipe-joined
 * list of "id::name" pairs) for a matching ID, then appends just that
 * name into "Attended Members" — skipping it if already there, so
 * re-scanning the same ticket by accident doesn't duplicate the name.
 */
function markAttendance(sheet, data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var values = sheet.getDataRange().getValues();
    for (var row = 1; row < values.length; row++) {
      var ids = String(values[row][${regIdsCol}] || '').split('|');
      for (var i = 0; i < ids.length; i++) {
        var parts = ids[i].split('::');
        if (parts[0] === data.registration_id) {
          var name = parts[1] || data.participant_name || '';
          var existingAttended = String(values[row][${attendedCol}] || '');
          var attendedList = existingAttended ? existingAttended.split(', ') : [];
          if (attendedList.indexOf(name) === -1) {
            attendedList.push(name);
            sheet.getRange(row + 1, ${attendedCol + 1}).setValue(attendedList.join(', '));
          }
          return ContentService
            .createTextOutput(JSON.stringify({ status: 'ok', found: true }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', found: false }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
${sharedEmailBlock(o)}`;
};

const buildScript = (o: SheetScriptGeneratorProps): string =>
  o.teamBased ? buildTeamScript(o) : buildSoloScript(o);

export const SheetScriptGenerator: React.FC<SheetScriptGeneratorProps> = (props) => {
  const [copied, setCopied] = useState(false);
  const columns = useMemo(() => buildColumns(props), [props]);
  const script = useMemo(() => buildScript(props), [props]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[#3D4852] mb-2">
          Columns this will create (added automatically)
        </p>
        <div className="flex flex-wrap gap-2">
          {columns.map((col) => (
            <span
              key={col}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#3B9EFF]/10 text-[#3B9EFF]"
            >
              {col}
            </span>
          ))}
        </div>
        <p className="text-xs text-[#A0AEC0] mt-2">
          {props.teamBased
            ? `You don't need to type these in — the script writes the header row itself on the first registration. Every teammate lands in the same row: names are appended into "Team Members" as people join, and "Attended Members" fills in one name at a time as each person's ticket gets scanned.`
            : `You don't need to type these in — the script writes the header row itself on the first registration. "Attended" starts blank and fills in with "Yes" automatically when a coordinator or admin scans that person's ticket QR code.`}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-[#3D4852]">
            Paste this into your Code.gs
          </p>
          <button
            type="button"
            onClick={copy}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              copied ? 'bg-green-500 text-white' : 'bg-[#1D1D1F] text-white hover:bg-black'
            }`}
          >
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </div>
        <pre className="max-h-72 overflow-auto rounded-2xl bg-[#1D1D1F] text-[#E6E6E6] text-[11px] leading-relaxed p-4 whitespace-pre">
          <code>{script}</code>
        </pre>
      </div>
    </div>
  );
};

export default SheetScriptGenerator;
