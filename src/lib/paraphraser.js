const ABBREVIATIONS = {
  tv: "television", tvs: "televisions",
  cctv: "Closed-Circuit Television (CCTV)",
  hdmi: "High-Definition Multimedia Interface (HDMI)",
  usb: "Universal Serial Bus (USB)",
  lan: "Local Area Network (LAN)", wan: "Wide Area Network (WAN)",
  pcb: "Printed Circuit Board (PCB)",
  plc: "Programmable Logic Controller (PLC)",
  dcs: "Distributed Control System (DCS)",
  scada: "Supervisory Control and Data Acquisition (SCADA)",
  hmi: "Human Machine Interface (HMI)",
  gis: "Gas Insulated Switchgear (GIS)",
  lng: "Liquefied Natural Gas (LNG)",
  rpm: "Revolutions Per Minute (RPM)",
  mv: "Medium Voltage", hv: "High Voltage", lv: "Low Voltage",
  hp: "High Pressure", lp: "Low Pressure", ip: "Intermediate Pressure",
  vfd: "Variable Frequency Drive (VFD)",
  esp: "Electrostatic Precipitator (ESP)",
  temp: "temperature", spec: "specification",
  calib: "calibration", diag: "diagnostic",
  maint: "maintenance", inst: "installation",
  conn: "connection", config: "configuration",
  approx: "approximately", reqd: "required",
  info: "information", insp: "inspection",
  rectif: "rectified", func: "functional",
  comm: "communication", oper: "operational",
  prod: "production", proc: "process",
  equip: "equipment", sys: "system",
  mtr: "meter", ctrl: "control",
  tx: "transmitter", cv: "control valve",
  ptz: "Pan-Tilt-Zoom (PTZ)", poe: "Power over Ethernet (PoE)",
  ip: "Internet Protocol (IP)", dc: "Direct Current (DC)",
  ac: "Alternating Current (AC)", ups: "Uninterruptible Power Supply (UPS)"
};

const VERB_IMPROVEMENTS = {
  changed: "replaced", checked: "inspected",
  fix: "rectified", fixed: "rectified",
  connected: "established connection for",
  started: "initiated startup of",
  cleaned: "performed cleaning of",
  tested: "conducted testing on",
  found: "identified", made: "fabricated",
  sure: "certain", hung: "mounted",
  drilled: "performed drilling operations for",
  labelled: "applied identification labels to",
  labeled: "applied identification labels to",
  rebooted: "performed a system reboot of",
  removed: "carefully removed",
  added: "installed additional",
  "turned on": "powered on", "turned off": "powered off",
  switched: "changed the configuration of",
  "looked at": "examined", tried: "attempted",
  "set up": "configured", setup: "configured",
  ran: "executed", used: "utilized",
  did: "performed", got: "obtained",
  saw: "observed", needed: "required",
  "took off": "removed", "put back": "reinstalled",
  "plug in": "connected", "unplug": "disconnected",
  "switch on": "energized", "switch off": "de-energized",
  "make sure": "verified that",
  "found out": "determined that",
  "set to": "configured to",
  "hook up": "connected",
  "hooked up": "connected",
  "power up": "powered on",
  "power down": "powered off",
  "shut down": "shutdown",
  "bring back": "restore",
  "brought back": "restored",
  "work on": "performed maintenance on",
  "carry out": "executed",
  "carried out": "executed",
  "look into": "investigated",
  "looked into": "investigated",
  "sort out": "resolved",
  "sorted out": "resolved",
  "take out": "removed",
  "check out": "inspected",
  "checked out": "inspected"
};

const OBJECT_IMPROVEMENTS = {
  "power supply": "power supply unit (PSU)",
  cables: "cabling and wiring", cable: "cable assembly",
  switches: "network switches", switch: "network switch",
  cameras: "CCTV camera units", camera: "CCTV camera unit",
  remotes: "remote control units", remote: "remote control unit",
  ports: "communication ports", port: "communication port",
  drivers: "device drivers", driver: "device driver",
  software: "software application",
  machine: "equipment", computer: "computer workstation",
  screen: "display screen", monitor: "monitoring display",
  wires: "electrical wiring", wire: "electrical wire",
  pipes: "piping system", pipe: "piping",
  valves: "control valves", valve: "control valve",
  pumps: "pump units", pump: "pump unit",
  motors: "motor assemblies", motor: "motor assembly",
  sensors: "sensor/transmitter units", sensor: "sensor/transmitter",
  brackets: "mounting brackets", bracket: "mounting bracket",
  mounts: "wall mount assemblies", mount: "wall mount assembly",
  "power box": "power distribution box",
  "switch box": "switchgear enclosure",
  "breakers": "circuit breakers", breaker: "circuit breaker",
  "fuses": "fuse units", fuse: "fuse unit",
  "transformers": "transformer units", transformer: "transformer unit",
  "routers": "network router units", router: "network router unit",
  "antennas": "antenna assemblies", antenna: "antenna assembly",
  "tools": "specialized tools", tool: "specialized tool",
  "bolts": "fastener bolts", bolt: "fastener bolt",
  "screws": "fastener screws", screw: "fastener screw",
  "seals": "sealing components", seal: "sealing component",
  "gaskets": "gasket assemblies", gasket: "gasket assembly"
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
  "working well": "operating within acceptable parameters",
  "working properly": "functioning as per design specifications",
  "good condition": "satisfactory operational condition",
  "looks good": "appears to meet all requirements",
  "all good": "all systems confirmed operational",
  perfectly: "to the required specifications",
  "up and running": "successfully commissioned and operational",
  "back online": "restored to online operational status",
  "back to normal": "restored to normal operating condition",
  "in good shape": "in satisfactory operational condition",
  "no errors": "no error conditions were detected",
  "no faults": "no fault conditions were identified",
  "running fine": "operating normally without anomalies",
  "all working": "all systems confirmed operational",
  "is fine": "is confirmed to be in satisfactory condition",
  "everything is fine": "all systems are confirmed to be in satisfactory condition",
  "no problem at all": "no anomalies or faults were detected",
  "workdone": "work was completed",
  "work done": "work was completed successfully",
  "workdone successfully": "work was completed successfully"
};

const FORMAL_CONVERSIONS = [
  { pattern: /a lot of/gi, replacement: "a significant number of" },
  { pattern: /kind of/gi, replacement: "approximately" },
  { pattern: /\bespacially\b/gi, replacement: "particularly" },
  { pattern: /\bespecially\b/gi, replacement: "particularly" },
  { pattern: /\bok\b(?!\s)/gi, replacement: "operational" },
  { pattern: /\bokay\b/gi, replacement: "operational" },
  { pattern: /\bgonna\b/gi, replacement: "going to" },
  { pattern: /\bwanna\b/gi, replacement: "want to" },
  { pattern: /\bcause\b/gi, replacement: "because" },
  { pattern: /\bcoz\b/gi, replacement: "because" },
  { pattern: /\bcuz\b/gi, replacement: "because" },
  { pattern: /\bthru\b/gi, replacement: "through" },
  { pattern: /\btill\b/gi, replacement: "until" },
  { pattern: /\balright\b/gi, replacement: "confirmed" },
  { pattern: /\byep\b/gi, replacement: "confirmed" },
  { pattern: /\bnope\b/gi, replacement: "negative" },
  { pattern: /\b btw\b/gi, replacement: " additionally," },
  { pattern: /\betc\b/gi, replacement: "and other relevant components" },
  { pattern: /\bvs\b/gi, replacement: "versus" },
  { pattern: /\bapprox\b/gi, replacement: "approximately" },
  { pattern: /\bre-installation\b/gi, replacement: "reinstallation" },
  { pattern: /\bpre-?configured\b/gi, replacement: "preconfigured" },
  { pattern: /\bre-?assigned\b/gi, replacement: "reassigned" },
  { pattern: /\bre-?installed\b/gi, replacement: "reinstalled" }
];

export function paraphraseText(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) return text;
  var r = text.trim();
  r = fixFormatting(r);
  r = improveWorkdone(r);
  r = expandAbbreviations(r);
  r = improveVerbs(r);
  r = improveObjects(r);
  r = improveResults(r);
  r = applyFormalConversions(r);
  r = improveSentenceStructure(r);
  r = fixNumbering(r);
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

function improveWorkdone(t) {
  var r = t.replace(/\bwork\s*done\s*successfully/gi, "work was completed successfully");
  r = r.replace(/\bwork\s*done\b/gi, "work was completed");
  r = r.replace(/\bworkdone\b/gi, "work was completed");
  return r;
}

function expandAbbreviations(t) {
  var r = t;
  var sorted = Object.entries(ABBREVIATIONS).sort(function(a, b) { return b[0].length - a[0].length; });
  for (var i = 0; i < sorted.length; i++) {
    var abbr = sorted[i][0];
    var full = sorted[i][1];
    var safe = abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    r = r.replace(new RegExp("\\b" + safe + "\\b", "gi"), full);
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

function improveObjects(t) {
  var r = t;
  var sorted = Object.entries(OBJECT_IMPROVEMENTS).sort(function(a, b) { return b[0].length - a[0].length; });
  for (var i = 0; i < sorted.length; i++) {
    var obj = sorted[i][0];
    var imp = sorted[i][1];
    var safe = obj.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    r = r.replace(new RegExp(safe, "gi"), imp);
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
  r = r.replace(/\b(Replaced|replaced|Installed|installed|Removed|removed|Checked|checked|Inspected|inspected|Cleaned|cleaned|Tested|tested|Mounted|mounted|Connected|connected|Configured|configured|Reconfigured|reconfigured|Assigned|assigned|Reassigned|reassigned|Isolated|isolated|Commissioned|commissioned)\s+(\d+[a-zA-Z]*\s+)(?!the|a|an|all|various|multiple|several|both|each|every)/gi, function(m, verb, spec) { return verb + " the " + spec; });
  r = r.replace(/results\s*:/gi, "Results:");
  r = r.replace(/result\s*:/gi, "Result:");
  return r;
}

function fixNumbering(t) {
  var r = t.replace(/^(\d+)\.\s*/gm, function(m, n) { return n + ". "; });
  r = r.replace(/\s+(\d+)\.\s+/g, "\n" + "$1" + ". ");
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
    if (/^\d+\.?\s*$/.test(t)) return t;
    if (/^[A-Z]{2,}[-\s]?\d{2,}[A-Z0-9\-]*$/i.test(t)) return t;
    if (/^(None|N\/A|NA|nil|no|yes)$/i.test(t)) return t;
    return paraphraseText(t);
  }).join("\n");
}