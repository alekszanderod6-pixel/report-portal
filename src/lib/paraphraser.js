const ABBREVIATIONS = {
  cctv: "Closed-Circuit Television (CCTV)",
  hdmi: "High-Definition Multimedia Interface (HDMI)",
  usb: "Universal Serial Bus (USB)",
  lan: "Local Area Network (LAN)",
  wan: "Wide Area Network (WAN)",
  pcb: "Printed Circuit Board (PCB)",
  plc: "Programmable Logic Controller (PLC)",
  dcs: "Distributed Control System (DCS)",
  scada: "Supervisory Control and Data Acquisition (SCADA)",
  hmi: "Human Machine Interface (HMI)",
  gis: "Gas Insulated Switchgear (GIS)",
  lng: "Liquefied Natural Gas (LNG)",
  rpm: "Revolutions Per Minute (RPM)",
  vfd: "Variable Frequency Drive (VFD)",
  esp: "Electrostatic Precipitator (ESP)",
  ptz: "Pan-Tilt-Zoom (PTZ)",
  poe: "Power over Ethernet (PoE)",
  ups: "Uninterruptible Power Supply (UPS)"
};

const VERB_IMPROVEMENTS = {
  changed: "replaced",
  checked: "inspected",
  fix: "rectified",
  fixed: "rectified",
  found: "identified",
  hung: "mounted",
  drilled: "performed drilling operations for",
  labelled: "applied identification labels to",
  labeled: "applied identification labels to",
  rebooted: "performed a system reboot of",
  removed: "carefully removed",
  "turned on": "powered on",
  "turned off": "powered off",
  "power up": "powered on",
  "power down": "powered off",
  "plug in": "connected",
  "hooked up": "connected",
  "bring back": "restored",
  "brought back": "restored",
  "work on": "performed maintenance on",
  "carry out": "executed",
  "carried out": "executed",
  "sort out": "resolved",
  "sorted out": "resolved",
  "look into": "investigated",
  "looked into": "investigated",
  "find out": "determined",
  "found out": "determined",
  "make sure": "verified that",
  "take out": "removed",
  "shut down": "shutdown"
};

const RESULT_IMPROVEMENTS = {
  "everything was okay": "all systems were confirmed to be operating within normal parameters",
  "everything okay": "all systems confirmed operational",
  "was okay": "was verified to be functioning correctly",
  "worked fine": "was confirmed to be operating as designed",
  "went online": "were successfully brought back online",
  "went back online": "were successfully restored to online status",
  "no issues": "no anomalies were detected",
  "no problem": "no faults were identified",
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

const FORMAL_CONVERSIONS = [
  { pattern: /\bespacially\b/gi, replacement: "particularly" },
  { pattern: /\bok\b(?!\s)/gi, replacement: "operational" },
  { pattern: /\bokay\b/gi, replacement: "operational" }
];

export function paraphraseText(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) return text;
  var r = text.trim();
  r = fixFormatting(r);
  r = expandAbbreviations(r);
  r = improveVerbs(r);
  r = improveResults(r);
  r = applyFormalConversions(r);
  r = improveSentenceStructure(r);
  r = finalPolish(r);
  return r;
}

function fixFormatting(t) {
  var r = t.replace(/\s+/g, " ");
  r = r.replace(/\s+([.,;:!?])/g, "$1");
  r = r.replace(/([.,;:!?])(?=[A-Za-z])/g, "$1 ");
  r = r.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
  r = r.replace(/\.\s*([A-Za-z])/g, ". $1");
  return r.trim();
}

function expandAbbreviations(t) {
  var r = t;
  var sorted = Object.entries(ABBREVIATIONS).sort(function(a, b) { return b[0].length - a[0].length; });
  for (var i = 0; i < sorted.length; i++) {
    var abbr = sorted[i][0];
    var full = sorted[i][1];
    var safe = abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    r = r.replace(new RegExp("(?<!\\()\\b" + safe + "\\b(?!\\d)", "gi"), full);
  }
  return r;
}

function improveVerbs(t) {
  var r = t;
  var sorted = Object.entries(VERB_IMPROVEMENTS).sort(function(a, b) { return b[0].length - a[0].length; });
  for (var i = 0; i < sorted.length; i++) {
    var verb = sorted[i][0];
    var imp = sorted[i][1];
    var safe = verb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    r = r.replace(new RegExp("\\b" + safe + "\\b", "gi"), function(m) {
      return m[0] === m[0].toUpperCase() ? imp.charAt(0).toUpperCase() + imp.slice(1) : imp;
    });
  }
  return r;
}

function improveResults(t) {
  var r = t;
  var keys = Object.keys(RESULT_IMPROVEMENTS);
  for (var i = 0; i < keys.length; i++) {
    var phrase = keys[i];
    var imp = RESULT_IMPROVEMENTS[phrase];
    var safe = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    r = r.replace(new RegExp(safe, "gi"), imp);
  }
  return r;
}

function applyFormalConversions(t) {
  var r = t;
  for (var i = 0; i < FORMAL_CONVERSIONS.length; i++) {
    r = r.replace(FORMAL_CONVERSIONS[i].pattern, FORMAL_CONVERSIONS[i].replacement);
  }
  return r;
}

function improveSentenceStructure(t) {
  var r = t;
  r = r.replace(/(^|\.\s+)([a-z])/g, function(m, p, l) { return p + l.toUpperCase(); });
  r = r.replace(/results\s*:/gi, "Results:");
  r = r.replace(/result\s*:/gi, "Result:");
  return r;
}

function finalPolish(t) {
  var r = t.replace(/\bthe the\b/gi, "the");
  r = r.replace(/\s+/g, " ").trim();
  if (r.length > 0 && /[a-zA-Z]$/.test(r) && !/[.:!?]$/.test(r) && !/^\d+\./.test(r)) {
    r += ".";
  }
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
    return paraphraseText(t);
  }).join("\n");
}

export function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").trim();
}
