import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/events/ImageUploader';
import { SheetScriptGenerator } from '@/components/events/SheetScriptGenerator';
import { LocationPicker } from '@/components/events/LocationPicker';
import { CERTIFICATE_FONTS } from '@/lib/certificate';
import {
  createEvent,
  updateEvent,
  getEventById,
  DEPARTMENTS,
  EVENT_TYPE_PRESETS,
  type EventLocation,
  type EventTimelineItem,
  type EventType,
} from '@/lib/firebase';

const DEPT_OPTIONS = DEPARTMENTS.map((d) => ({ value: d, label: d }));

const TYPE_OPTIONS: { value: string; label: string }[] = [
  ...EVENT_TYPE_PRESETS.map((t) => ({ value: t, label: t })),
  { value: '__custom__', label: 'Other (type your own)…' },
];

// Simple on/off pill switch used throughout this form
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }> = ({
  checked, onChange, label, hint,
}) => (
  <div className="flex items-center gap-3">
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6C63FF]"></div>
    </label>
    <span className="text-[#3D4852] font-medium">{label}</span>
    {hint && <span className="text-sm text-[#6B7280]">{hint}</span>}
  </div>
);

export const CoordinatorEventForm: React.FC = () => {
  const { eventId } = useParams();
  const isEdit = Boolean(eventId);
  const navigate = useNavigate();
  const { user, userData } = useAuth();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('Seminar');
  // When the coordinator picks "Other", `type` holds their free-text value
  // and this flag keeps the text box visible.
  const [customType, setCustomType] = useState(false);
  const [about, setAbout] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Location
  const [useMap, setUseMap] = useState(true);
  const [location, setLocation] = useState<EventLocation | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [mapLink, setMapLink] = useState('');

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Custom registration deadline
  const [customDeadline, setCustomDeadline] = useState(false);
  const [regEndDate, setRegEndDate] = useState('');
  const [regEndTime, setRegEndTime] = useState('');

  const [unlimitedSeats, setUnlimitedSeats] = useState(false);
  const [totalSeats, setTotalSeats] = useState(50);
  const [fee, setFee] = useState(0);
  const [targetBranches, setTargetBranches] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<EventTimelineItem[]>([{ time: '', title: '' }]);

  // Contact / organizer
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [extraPhones, setExtraPhones] = useState<string[]>([]);

  // Payment
  const [isPaid, setIsPaid] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [paymentQrImage, setPaymentQrImage] = useState<string[]>([]);

  // Certificate
  const [certTemplate, setCertTemplate] = useState<string[]>([]);
  const [certX, setCertX] = useState(50);
  const [certY, setCertY] = useState(50);
  const [certFontSize, setCertFontSize] = useState(48);
  const [certColor, setCertColor] = useState('#1D1D1F');
  const [certFont, setCertFont] = useState(CERTIFICATE_FONTS[0].value);

  // Team-based registration
  const [teamBased, setTeamBased] = useState(false);
  const [teamSize, setTeamSize] = useState(4);
  const [requiresEmail, setRequiresEmail] = useState(false);

  // External Google Form instead of in-app registration
  const [useExternalForm, setUseExternalForm] = useState(false);
  const [externalFormUrl, setExternalFormUrl] = useState('');

  // Log every registration into a Google Sheet via an Apps Script webhook
  const [useSheetLog, setUseSheetLog] = useState(false);
  const [sheetViewUrl, setSheetViewUrl] = useState('');
  const [showScript, setShowScript] = useState(false);
  const [sheetWebhookUrl, setSheetWebhookUrl] = useState('');

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userData && !contactName) setContactName(userData.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  useEffect(() => {
    if (!isEdit || !eventId) return;
    (async () => {
      const ev = await getEventById(eventId);
      if (!ev) return;
      setTitle(ev.title || '');
      setType(ev.type || 'Seminar');
      setCustomType(!!ev.type && !EVENT_TYPE_PRESETS.includes(ev.type));
      setAbout(ev.about || '');
      setImages(ev.images || []);
      setLocation(ev.location || null);
      setManualAddress(ev.location?.address || '');
      setMapLink(ev.map_link || '');
      setUseMap(ev.use_map !== false);
      setDate(ev.date || '');
      setStartTime(ev.start_time || '');
      setEndTime(ev.end_time || '');
      if (ev.registration_end_date || ev.registration_end_time) {
        setCustomDeadline(true);
        setRegEndDate(ev.registration_end_date || '');
        setRegEndTime(ev.registration_end_time || '');
      }
      const isUnlimited = ev.total_seats === null || ev.total_seats === undefined;
      setUnlimitedSeats(isUnlimited);
      setTotalSeats(isUnlimited ? 50 : ev.total_seats);
      setFee(ev.registration_fee || 0);
      setTargetBranches(ev.target_branches || []);
      setTimeline(ev.timeline?.length ? ev.timeline : [{ time: '', title: '' }]);
      setContactName(ev.contact_name || ev.coordinator_name || '');
      setContactPhone(ev.contact_phone || '');
      setExtraPhones(ev.contact_phones || []);
      setIsPaid(!!ev.is_paid);
      setUpiId(ev.upi_id || '');
      setPaymentQrImage(ev.payment_qr_image ? [ev.payment_qr_image] : []);
      setCertTemplate(ev.certificate_template_url ? [ev.certificate_template_url] : []);
      if (ev.certificate_name_position) {
        setCertX(ev.certificate_name_position.xPercent);
        setCertY(ev.certificate_name_position.yPercent);
        setCertFontSize(ev.certificate_name_position.fontSize);
        setCertColor(ev.certificate_name_position.color);
        setCertFont(ev.certificate_name_position.fontFamily || CERTIFICATE_FONTS[0].value);
      }
      setTeamBased(!!ev.team_based);
      setTeamSize(ev.team_size || 4);
      setRequiresEmail(!!ev.requires_email);
      setUseExternalForm(!!ev.external_form_url);
      setExternalFormUrl(ev.external_form_url || '');
      setUseSheetLog(!!ev.sheet_webhook_url);
      setSheetWebhookUrl(ev.sheet_webhook_url || '');
      setSheetViewUrl(ev.sheet_view_url || '');
    })();
  }, [isEdit, eventId]);

  const toggleBranch = (branch: string) => {
    setTargetBranches((prev) =>
      prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
    );
  };

  const updateTimelineRow = (i: number, field: 'time' | 'title', value: string) => {
    setTimeline((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  };

  const addTimelineRow = () => setTimeline((prev) => [...prev, { time: '', title: '' }]);
  const removeTimelineRow = (i: number) => setTimeline((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (customType && !type.trim()) {
      setError('Enter a name for your custom event type.');
      return;
    }
    if (!title.trim() || !date || !startTime || !endTime) {
      setError('Title, date, start time and end time are required.');
      return;
    }
    if (!unlimitedSeats && (!totalSeats || totalSeats < 1)) {
      setError('Enter a valid number of seats, or turn on Unlimited Seats.');
      return;
    }
    if (teamBased && (!teamSize || teamSize < 2)) {
      setError('Team size must be at least 2 when team-based registration is on.');
      return;
    }
    if (useExternalForm && !externalFormUrl.trim()) {
      setError('Enter the Google Form link, or turn off the external form option.');
      return;
    }
    if (useSheetLog && !sheetWebhookUrl.trim()) {
      setError('Enter the Google Sheet webhook URL, or turn off sheet logging.');
      return;
    }
    if (isPaid && (!fee || fee <= 0)) {
      setError('Enter a fee amount, or turn off "This event has a fee".');
      return;
    }
    if (isPaid && !upiId.trim() && paymentQrImage.length === 0) {
      setError('Add a UPI ID or upload a payment QR code so students can pay.');
      return;
    }
    if (!user || !userData) return;

    // Build the location payload: interactive-map pin if enabled and set,
    // otherwise fall back to the plain manual address text.
    const finalLocation: EventLocation | undefined = useMap && location
      ? location
      : manualAddress.trim()
        ? { address: manualAddress.trim() }
        : undefined;

    setSaving(true);
    try {
      const payload = {
        title,
        type,
        about,
        images,
        date,
        start_time: startTime,
        end_time: endTime,
        registration_end_date: customDeadline ? regEndDate || undefined : undefined,
        registration_end_time: customDeadline ? regEndTime || undefined : undefined,
        total_seats: unlimitedSeats ? null : totalSeats,
        registration_fee: fee,
        is_mandatory: false,
        target_branches: targetBranches,
        timeline: timeline.filter((t) => t.time && t.title),
        coordinator_id: user.uid,
        coordinator_name: userData.name,
        contact_name: contactName.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        contact_phones: extraPhones.filter((p) => p.trim()),
        is_paid: isPaid,
        upi_id: isPaid ? upiId.trim() || undefined : undefined,
        payment_qr_image: isPaid ? paymentQrImage[0] : undefined,
        certificate_template_url: certTemplate[0] || undefined,
        certificate_name_position: certTemplate[0]
          ? { xPercent: certX, yPercent: certY, fontSize: certFontSize, color: certColor, fontFamily: certFont }
          : undefined,
        use_map: useMap,
        map_link: mapLink.trim() || undefined,
        team_based: teamBased,
        team_size: teamBased ? teamSize : undefined,
        requires_email: teamBased ? requiresEmail : undefined,
        external_form_url: useExternalForm ? externalFormUrl.trim() : undefined,
        sheet_webhook_url: useSheetLog ? sheetWebhookUrl.trim() : undefined,
        sheet_view_url: useSheetLog ? sheetViewUrl.trim() || undefined : undefined,
        ...(finalLocation ? { location: finalLocation } : {}),
      };

      if (isEdit && eventId) {
        await updateEvent(eventId, payload);
      } else {
        await createEvent(payload);
      }
      navigate(userData.role === 'admin' ? '/admin/events' : '/coordinator');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display font-extrabold text-3xl text-[#3D4852] mb-8">
          {isEdit ? 'Edit Event' : 'New Event'}
        </h1>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm">{error}</div>
            )}

            <Input label="Event Name" value={title} onChange={(e) => setTitle(e.target.value)} required />

            <Select
              label="Type"
              value={customType ? '__custom__' : type}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setCustomType(true);
                  setType('');
                } else {
                  setCustomType(false);
                  setType(e.target.value);
                }
              }}
              options={TYPE_OPTIONS}
            />
            {customType && (
              <Input
                label="Custom event type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. Ideathon, Guest Lecture, Tech Expo"
                required
              />
            )}

            <div>
              <label className="block text-sm font-medium text-[#3D4852] mb-2">About</label>
              <textarea
                className="w-full px-5 py-4 rounded-2xl bg-[#E0E5EC] shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] focus:outline-none"
                rows={4}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="What is this event about?"
              />
            </div>

            <ImageUploader images={images} onChange={setImages} />

            {/* ── Organizer / Contact ── */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Coordinator / Organizer Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Shown to students"
              />
              <Input
                label="Coordinator Phone Number"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
              />
            </div>

            {/* Additional contact numbers — not just the coordinator's own */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[#3D4852]">
                  Other Contact Numbers (optional)
                </label>
                <button
                  type="button"
                  onClick={() => setExtraPhones((p) => [...p, ''])}
                  className="text-sm font-semibold text-[#6C63FF] hover:underline"
                >
                  + Add number
                </button>
              </div>
              {extraPhones.length === 0 ? (
                <p className="text-xs text-[#A0AEC0]">
                  Add a co-coordinator, volunteer, or any other number students can reach.
                </p>
              ) : (
                <div className="space-y-2">
                  {extraPhones.map((phone, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) =>
                          setExtraPhones((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)))
                        }
                        placeholder="e.g. +91 98765 43210"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setExtraPhones((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-red-500 text-sm px-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Location ── */}
            <div className="p-5 rounded-2xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.4)] space-y-4">
              <Toggle
                checked={useMap}
                onChange={setUseMap}
                label="Show interactive map"
                hint="(optional — turn off to enter a plain address instead)"
              />

              {useMap ? (
                <LocationPicker value={location} onChange={setLocation} />
              ) : (
                <Input
                  label="Location / Address (text)"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="e.g. Main Auditorium, SIMATS Engineering College"
                />
              )}

              <Input
                label="Google Maps Link (optional)"
                value={mapLink}
                onChange={(e) => setMapLink(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
              />
              <p className="text-xs text-[#A0AEC0]">
                Used by the "Locate" button students see on this event. If left blank, the address text above is used instead.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              <Input label="Start Time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              <Input label="End Time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>

            {/* ── Registration deadline ── */}
            <div className="p-5 rounded-2xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.4)] space-y-4">
              <Toggle
                checked={customDeadline}
                onChange={setCustomDeadline}
                label="Custom registration deadline"
                hint="(default: registration closes when the event starts)"
              />
              {customDeadline && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Registration Ends — Date"
                    type="date"
                    value={regEndDate}
                    onChange={(e) => setRegEndDate(e.target.value)}
                  />
                  <Input
                    label="Registration Ends — Time"
                    type="time"
                    value={regEndTime}
                    onChange={(e) => setRegEndTime(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-[#3D4852]">Total Seats</label>
                  <label className="flex items-center gap-2 text-xs text-[#6B7280] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={unlimitedSeats}
                      onChange={(e) => setUnlimitedSeats(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#6C63FF]"
                    />
                    Unlimited seats
                  </label>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={unlimitedSeats ? '' : totalSeats}
                  onChange={(e) => setTotalSeats(Number(e.target.value))}
                  disabled={unlimitedSeats}
                  placeholder={unlimitedSeats ? 'Unlimited' : undefined}
                  className={unlimitedSeats ? 'opacity-50 cursor-not-allowed' : ''}
                />
              </div>
              <Input
                label="Registration Fee (₹, 0 = free)"
                type="number"
                min={0}
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                disabled={!isPaid}
                className={!isPaid ? 'opacity-50 cursor-not-allowed' : ''}
              />
            </div>

            {/* ── Payment ── */}
            <div className="p-5 rounded-2xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.4)] space-y-4">
              <Toggle
                checked={isPaid}
                onChange={(v) => { setIsPaid(v); if (v && !fee) setFee(0); }}
                label="This event has a fee"
                hint="(off = free event)"
              />
              {isPaid && (
                <>
                  <Input
                    label="UPI ID"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@okhdfcbank"
                  />
                  <div>
                    <label className="block text-sm font-medium text-[#3D4852] mb-2">
                      Or upload a payment QR code (optional)
                    </label>
                    <ImageUploader images={paymentQrImage} onChange={setPaymentQrImage} max={1} />
                  </div>
                  <p className="text-xs text-[#A0AEC0]">
                    When a student enrolls, they'll see a "Pay via UPI" button built from your UPI ID
                    (this opens their phone's UPI app chooser — GPay, PhonePe, Paytm, etc. — on Android;
                    the uploaded QR code works as a fallback on any phone). After paying, they enter their
                    UPI transaction reference number. <strong>Their ticket is only generated once you or an
                    admin manually confirms that reference against your own bank/UPI app</strong> — there's no
                    way to verify a UPI payment automatically without a paid payment gateway, so this manual
                    check happens from your dashboard's Payment Verification queue.
                  </p>
                </>
              )}
            </div>

            {/* ── Certificate ── */}
            <div className="p-5 rounded-2xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.4)] space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#3D4852] mb-2">
                  Certificate Template (optional)
                </label>
                <ImageUploader images={certTemplate} onChange={setCertTemplate} max={1} />
                <p className="text-xs text-[#A0AEC0] mt-2">
                  Upload a certificate design with a blank space for the attendee's name. Students can only
                  download it after you (or admin) scan their ticket's QR code at the event.
                </p>
              </div>

              {certTemplate.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[#3D4852] mb-2">Where should the name go?</p>
                  <div className="relative rounded-2xl overflow-hidden border border-black/10">
                    <img
                      src={certTemplate[0]}
                      alt="Certificate template preview"
                      className="w-full block cursor-crosshair"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setCertX(Math.round(((e.clientX - rect.left) / rect.width) * 100));
                        setCertY(Math.round(((e.clientY - rect.top) / rect.height) * 100));
                      }}
                    />
                    <span
                      className="absolute -translate-x-1/2 -translate-y-1/2 font-bold pointer-events-none whitespace-nowrap"
                      style={{
                        left: `${certX}%`,
                        top: `${certY}%`,
                        fontSize: `${Math.max(12, certFontSize / 2.5)}px`,
                        color: certColor,
                        fontFamily: certFont,
                      }}
                    >
                      Student Name
                    </span>
                  </div>
                  <p className="text-xs text-[#A0AEC0] mt-2">Click on the image above to place the name.</p>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[#3D4852] mb-2">Font</label>
                    <select
                      value={certFont}
                      onChange={(e) => setCertFont(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-[#E0E5EC] shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] focus:outline-none"
                      style={{ fontFamily: certFont }}
                    >
                      {CERTIFICATE_FONTS.map((f) => (
                        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Input
                      label="Font Size (px)"
                      type="number"
                      min={10}
                      value={certFontSize}
                      onChange={(e) => setCertFontSize(Number(e.target.value))}
                    />
                    <div>
                      <label className="block text-sm font-medium text-[#3D4852] mb-2">Text Color</label>
                      <input
                        type="color"
                        value={certColor}
                        onChange={(e) => setCertColor(e.target.value)}
                        className="w-full h-[50px] rounded-2xl cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Team-based registration ── */}
            <div className="p-5 rounded-2xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.4)] space-y-4">
              <Toggle checked={teamBased} onChange={setTeamBased} label="Team-based registration" />
              {teamBased && (
                <>
                  <Input
                    label="Members per team"
                    type="number"
                    min={2}
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                  />
                  <Toggle
                    checked={requiresEmail}
                    onChange={setRequiresEmail}
                    label="Require teammate emails"
                    hint="(Gmail needed)"
                  />
                  <p className="text-xs text-[#A0AEC0]">
                    Students will be asked for a team name and each teammate's name{requiresEmail ? ' and email' : ''} when they enroll. A separate ticket is generated for every team member.
                  </p>
                </>
              )}
            </div>

            {/* ── External Google Form ── */}
            <div className="p-5 rounded-2xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.4)] space-y-4">
              <Toggle
                checked={useExternalForm}
                onChange={setUseExternalForm}
                label="Use an external Google Form instead"
                hint="(overrides team/Gmail settings above)"
              />
              {useExternalForm && (
                <>
                  <Input
                    label="Google Form Link"
                    value={externalFormUrl}
                    onChange={(e) => setExternalFormUrl(e.target.value)}
                    placeholder="https://forms.gle/..."
                  />
                  <p className="text-xs text-[#A0AEC0]">
                    When a student clicks Enroll, this form opens in a new tab. After they submit it and return, they confirm in-app and their ticket is generated.
                  </p>
                </>
              )}
            </div>

            {/* ── Google Sheet logging ── */}
            <div className="p-5 rounded-2xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.4)] space-y-4">
              <Toggle
                checked={useSheetLog}
                onChange={setUseSheetLog}
                label="Log registrations to a Google Sheet"
              />
              {useSheetLog && (
                <>
                  <Input
                    label="Google Sheet Webhook URL"
                    value={sheetWebhookUrl}
                    onChange={(e) => setSheetWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                  />
                  <p className="text-xs text-[#A0AEC0]">
                    Every registration is sent to your sheet in addition to being saved in the app.
                    This never blocks or delays a student's ticket, even if the sheet is unreachable.
                  </p>

                  <Input
                    label="Google Sheet Link (to view)"
                    value={sheetViewUrl}
                    onChange={(e) => setSheetViewUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                  />
                  <p className="text-xs text-[#A0AEC0]">
                    The normal share link to the sheet itself (not the script URL above). "View Registered
                    Students" opens this directly instead of showing the list inside the app.
                  </p>

                  <div className="pt-4 border-t border-[#D1D9E6]">
                    <Toggle
                      checked={showScript}
                      onChange={setShowScript}
                      label="Show me the script to paste"
                    />
                  </div>

                  {showScript && (
                    <div className="pt-2">
                      <SheetScriptGenerator
                        teamBased={teamBased}
                        requiresEmail={requiresEmail}
                        hasFee={isPaid}
                        sendEmail={false}
                        siteUrl={typeof window !== 'undefined' ? window.location.origin : undefined}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3D4852] mb-2">
                Open to Departments (none selected = all)
              </label>
              <div className="flex flex-wrap gap-2">
                {DEPT_OPTIONS.map((d) => (
                  <button
                    type="button"
                    key={d.value}
                    onClick={() => toggleBranch(d.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      targetBranches.includes(d.value)
                        ? 'bg-[#6C63FF] text-white'
                        : 'bg-[#E0E5EC] text-[#3D4852] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3D4852] mb-2">Timeline</label>
              <div className="space-y-3">
                {timeline.map((row, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <Input
                      className="w-32"
                      placeholder="09:00 AM"
                      value={row.time}
                      onChange={(e) => updateTimelineRow(i, 'time', e.target.value)}
                    />
                    <Input
                      className="flex-1"
                      placeholder="Grand Opening Show"
                      value={row.title}
                      onChange={(e) => updateTimelineRow(i, 'title', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeTimelineRow(i)}
                      className="text-red-500 text-sm px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={addTimelineRow}>
                  + Add row
                </Button>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={saving}>
              {isEdit ? 'Save Changes' : 'Send Request'}
            </Button>
            {!isEdit && (
              <p className="text-xs text-center text-[#A0AEC0]">
                This sends the event to admin for approval — it won't appear to students until approved.
              </p>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CoordinatorEventForm;