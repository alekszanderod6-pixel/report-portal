const ABBREVIATIONS = {
  cctv: "Closed-Circuit Television (CCTV)", hdmi: "High-Definition Multimedia Interface (HDMI)",
  usb: "Universal Serial Bus (USB)", lan: "Local Area Network (LAN)", wan: "Wide Area Network (WAN)",
  pcb: "Printed Circuit Board (PCB)", plc: "Programmable Logic Controller (PLC)",
  dcs: "Distributed Control System (DCS)", scada: "Supervisory Control and Data Acquisition (SCADA)",
  hmi: "Human Machine Interface (HMI)", gis: "Gas Insulated Switchgear (GIS)",
  lng: "Liquefied Natural Gas (LNG)", rpm: "Revolutions Per Minute (RPM)",
  vfd: "Variable Frequency Drive (VFD)", esp: "Electrostatic Precipitator (ESP)",
  ptz: "Pan-Tilt-Zoom (PTZ)", poe: "Power over Ethernet (PoE)",
  ups: "Uninterruptible Power Supply (UPS)"
};

const VERBS = {
  "changed": "replaced", "checked": "inspected", "fix": "rectified", "fixed": "rectified",
  "found": "identified", "hung": "mounted", "drilled": "performed drilling operations for",
  "labelled": "applied identification labels to", "labeled": "applied identification labels to",
  "rebooted": "performed a system reboot of", "removed": "carefully removed",
  "turned on": "powered on", "turned off": "powered off", "power up": "powered on",
  "power down": "powered off", "plug in": "connected", "hooked up": "connected",
  "bring back": "restored", "brought back": "restored", "work on": "performed maintenance on",
  "carry out": "executed", "carried out": "executed", "sort out": "resolved",
  "sorted out": "resolved", "look into": "investigated", "looked into": "investigated",
  "find out": "determined", "found out": "determined", "make sure": "verified that",
  "take out": "removed", "shut down": "shutdown"
};

const RESULTS = {
  "everything was okay": "all systems were confirmed to be operating within normal parameters",
  "everything okay": "all systems confirmed operational",
  "was okay": "was verified to be functioning correctly",
  "worked fine": "was confirmed to be operating as designed",
  "went online": "were successfully brought back online",
  "went back online": "were successfully restored to online status",
  "no issues": "no anomalies were detected", "no problem": "no faults were identified",
  "no problem at all": "no anomalies or faults were detected",
  "working well": "operating within acceptable parameters",
  "working properly": "functioning as per design specifications",
  "good condition": "satisfactory operational condition",
  "all good": "all systems confirmed operational",
  "back online": "restored to online operational status",
  "back to normal": "restored to normal operating condition",
  "up and running": "successfully commissioned and operational",
  "running fine": "operating normally without anomalies",
  "all working": "all systems confirmed operational",
  "workdone successfully": "work was completed successfully",
  "work done successfully": "work was completed successfully",
  "workdone": "work was completed successfully",
  "work done": "work was completed successfully"
};

const FORMAL = [
  { pattern: /\bespacially\b/gi, replacement: "particularly" },
  { pattern: /\bok\b(?!\s)/gi, replacement: "operational" },
  { pattern: /\bokay\b/gi, replacement: "operational" }
];

function doParaphrase(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) return text;
  var r = text.trim();
  r = r.replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.,;:!?])(?=[A-Za-z])/g, "$1 ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\.\s*([A-Za-z])/g, ". $1");

  var sorted = Object.entries(ABBREVIATIONS).sort(function(a, b) { return b[0].length - a[0].length; });
  for (var i = 0; i < sorted.length; i++) {
    var a = sorted[i][0], f = sorted[i][1];
    var sf = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    r = r.replace(new RegExp("(?<!\\()\\b" + sf + "\\b(?!\\d)", "gi"), f);
  }

  sorted = Object.entries(VERBS).sort(function(a, b) { return b[0].length - a[0].length; });
  for (var j = 0; j < sorted.length; j++) {
    var v = sorted[j][0], im = sorted[j][1];
    var sfv = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    r = r.replace(new RegExp("\\b" + sfv + "\\b", "gi"), function(m) {
      return m[0] === m[0].toUpperCase() ? im.charAt(0).toUpperCase() + im.slice(1) : im;
    });
  }

  var rk = Object.keys(RESULTS);
  for (var k = 0; k < rk.length; k++) {
    var ph = rk[k], im2 = RESULTS[ph];
    var sf2 = ph.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    r = r.replace(new RegExp(sf2, "gi"), im2);
  }

  for (var m2 = 0; m2 < FORMAL.length; m2++) r = r.replace(FORMAL[m2].pattern, FORMAL[m2].replacement);

  r = r.replace(/(^|\.\s+)([a-z])/g, function(match, p, l) { return p + l.toUpperCase(); })
    .replace(/results\s*:/gi, "Results:")
    .replace(/result\s*:/gi, "Result:");
  r = r.replace(/\bthe the\b/gi, "the").replace(/\s+/g, " ").trim();
  if (r.length > 0 && /[a-zA-Z]$/.test(r) && !/[.:!?]$/.test(r) && !/^\d+\./.test(r)) r += ".";
  return r;
}

export function paraphraseField(text) {
  if (!text || text.trim().length < 5) return text;
  return text.split("\n").map(function(line) {
    var t = line.trim();
    if (!t) return "";
    if (/^Results?\s*:/i.test(t)) return t;
    if (/^\d+\.?\s*$/i.test(t)) return t;
    if (/^[A-Z]{2,}[-\s]?\d{2,}[A-Z0-9\-]*$/i.test(t)) return t;
    if (/^(None|N\/A|NA|nil|no|yes)$/i.test(t)) return t;
    if (/\d+\.\s*(DS-|WL-|POE|MY\d|CHNT|HD\d)/i.test(t)) return t;
    return doParaphrase(t);
  }).join("\n");
}

export function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<div[^>]*>/gi, "")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .trim();
}
