const ABBREVIATIONS = {
  tv: 'television', tvs: 'televisions',
  cctv: 'Closed-Circuit Television (CCTV)',
  hdmi: 'High-Definition Multimedia Interface (HDMI)',
  usb: 'Universal Serial Bus (USB)',
  lan: 'Local Area Network (LAN)', wan: 'Wide Area Network (WAN)',
  pcb: 'Printed Circuit Board (PCB)',
  plc: 'Programmable Logic Controller (PLC)',
  dcs: 'Distributed Control System (DCS)',
  scada: 'Supervisory Control and Data Acquisition (SCADA)',
  hmi: 'Human Machine Interface (HMI)',
  gis: 'Gas Insulated Switchgear (GIS)',
  lng: 'Liquefied Natural Gas (LNG)',
  rpm: 'Revolutions Per Minute (RPM)',
  mv: 'Medium Voltage', hv: 'High Voltage', lv: 'Low Voltage',
  hp: 'High Pressure', lp: 'Low Pressure', ip: 'Intermediate Pressure',
  vfd: 'Variable Frequency Drive (VFD)',
  esp: 'Electrostatic Precipitator (ESP)',
  temp: 'temperature', spec: 'specification',
  calib: 'calibration', diag: 'diagnostic',
  maint: 'maintenance', inst: 'installation',
  conn: 'connection', config: 'configuration',
  'w': 'with', 'w/o': 'without',
  approx: 'approximately', reqd: 'required',
  info: 'information', insp: 'inspection',
};

const VERB_IMPROVEMENTS = {
  changed: 'replaced', checked: 'inspected',
  fix: 'rectified', fixed: 'rectified',
  connected: 'established connection for',
  started: 'initiated startup of',
  cleaned: 'performed cleaning of',
  tested: 'conducted testing on',
  found: 'identified', made: 'fabricated',
  sure: 'certain', hung: 'mounted',
  drilled: 'performed drilling operations for',
  labelled: 'applied identification labels to',
  labeled: 'applied identification labels to',
  rebooted: 'performed a system reboot of',
  removed: 'carefully removed',
  added: 'installed additional',
  'turned on': 'powered on', 'turned off': 'powered off',
  switched: 'changed the configuration of',
  'looked at': 'examined', tried: 'attempted',
  'set up': 'configured', setup: 'configured',
  ran: 'executed', used: 'utilized',
  did: 'performed', got: 'obtained',
  saw: 'observed', needed: 'required',
};

const OBJECT_IMPROVEMENTS = {
  'power supply': 'power supply unit (PSU)',
  cables: 'cabling and wiring', cable: 'cable assembly',
  switches: 'network switches', switch: 'network switch',
  cameras: 'CCTV camera units', camera: 'CCTV camera unit',
  remotes: 'remote control units', remote: 'remote control unit',
  ports: 'communication ports', port: 'communication port',
  drivers: 'device drivers', driver: 'device driver',
  software: 'software application',
  machine: 'equipment', computer: 'computer workstation',
  screen: 'display screen', monitor: 'monitoring display',
  wires: 'electrical wiring', wire: 'electrical wire',
  pipes: 'piping system', pipe: 'piping',
  valves: 'control valves', valve: 'control valve',
  pumps: 'pump units', pump: 'pump unit',
  motors: 'motor assemblies', motor: 'motor assembly',
  sensors: 'sensor/transmitter units', sensor: 'sensor/transmitter',
  brackets: 'mounting brackets', bracket: 'mounting bracket',
  mounts: 'wall mount assemblies', mount: 'wall mount assembly',
};

const RESULT_IMPROVEMENTS = {
  'everything was okay': 'all systems were confirmed to be operating within normal parameters',
  'everything okay': 'all systems confirmed operational',
  'was okay': 'was verified to be functioning correctly',
  'worked fine': 'was confirmed to be operating as designed',
  'went online': 'were successfully brought back online',
  'went back online': 'were successfully restored to online status',
  'no issues': 'no anomalies were detected',
  'no problem': 'no faults were identified',
  'working well': 'operating within acceptable parameters',
  'working properly': 'functioning as per design specifications',
  'good condition': 'satisfactory operational condition',
  'looks good': 'appears to meet all requirements',
  'all good': 'all systems confirmed operational',
  perfectly: 'to the required specifications',
};

const FORMAL_CONVERSIONS = [
  { pattern: /a lot of/gi, replacement: 'a significant number of' },
  { pattern: /kind of/gi, replacement: 'approximately' },
  { pattern: /\bespacially\b/gi, replacement: 'particularly' },
  { pattern: /\bespecially\b/gi, replacement: 'particularly' },
  { pattern: /\bok\b(?!\s)/gi, replacement: 'operational' },
  { pattern: /\bokay\b/gi, replacement: 'operational' },
];

export function paraphraseText(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) return text;
  let r = text.trim();
  r = fixFormatting(r);
  r = expandAbbreviations(r);
  r = improveVerbs(r);
  r = improveObjects(r);
  r = improveResults(r);
  r = applyFormalConversions(r);
  r = improveSentenceStructure(r);
  r = finalPolish(r);
  return r;
}

function fixFormatting(t) {
  let r = t.replace(/\s+/g, ' ');
  r = r.replace(/\s+([.,;:!?])/g, '$1');
  r = r.replace(/([.,;:!?])(?=[A-Za-z])/g, '$1 ');
  r = r.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
  r = r.replace(/\.\s*([A-Za-z])/g, '. $1');
  return r.trim();
}

function expandAbbreviations(t) {
  let r = t;
  const sorted = Object.entries(ABBREVIATIONS).sort((a, b) => b[0].length - a[0].length);
  for (const [abbr, full] of sorted) {
    r = r.replace(new RegExp('\\b' + abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'), full);
  }
  return r;
}

function improveVerbs(t) {
  let r = t;
  const sorted = Object.entries(VERB_IMPROVEMENTS).sort((a, b) => b[0].length - a[0].length);
  for (const [verb, imp] of sorted) {
    r = r.replace(new RegExp('\\b' + verb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'), (m) =>
      m[0] === m[0].toUpperCase()
        ? imp.charAt(0).toUpperCase() + imp.slice(1)
        : imp
    );
  }
  return r;
}

function improveObjects(t) {
  let r = t;
  const sorted = Object.entries(OBJECT_IMPROVEMENTS).sort((a, b) => b[0].length - a[0].length);
  for (const [obj, imp] of sorted) {
    r = r.replace(new RegExp(obj.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), imp);
  }
  return r;
}

function improveResults(t) {
  let r = t;
  for (const [phrase, imp] of Object.entries(RESULT_IMPROVEMENTS)) {
    r = r.replace(
      new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      imp
    );
  }
  return r;
}

function applyFormalConversions(t) {
  let r = t;
  for (const { pattern, replacement } of FORMAL_CONVERSIONS) {
    r = r.replace(pattern, replacement);
  }
  return r;
}

function improveSentenceStructure(t) {
  let r = t;
  r = r.replace(/(^|\.\s+)([a-z])/g, (m, p, l) => p + l.toUpperCase());
  r = r.replace(
    /\b(Replaced|replaced|Installed|installed|Removed|removed|Checked|checked|Inspected|inspected|Cleaned|cleaned|Tested|tested|Mounted|mounted|Connected|connected)\s+(\d+[a-zA-Z]*\s+)(?!the|a|an|all|various|multiple|several|both|each|every)/gi,
    (m, verb, spec) => verb + ' the ' + spec
  );
  r = r.replace(/results\s*:/gi, 'Results:');
  return r;
}

function finalPolish(t) {
  let r = t.replace(/\bthe the\b/gi, 'the');
  r = r.replace(/\s+/g, ' ').trim();
  if (r.length > 0 && /[a-zA-Z]$/.test(r) && !/[.:!?]$/.test(r) && !/^\d+\./.test(r)) {
    r += '.';
  }
  return r;
}

export function paraphraseField(text) {
  if (!text || text.trim().length < 5) return text;
  return text
    .split('\n')
    .map((line) => {
      const t = line.trim();
      if (!t) return '';
      if (/^Results?\s*:/i.test(t)) return t;
      if (/^\d+\.?\s*$/.test(t)) return t;
      if (/^[A-Z]{2,}[-\s]?\d{2,}[A-Z0-9\-]*$/i.test(t)) return t;
      if (/^(None|N\/A|NA|nil|no|yes)$/i.test(t)) return t;
      return paraphraseText(t);
    })
    .join('\n');
}
