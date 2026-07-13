// ─── Spell correction dictionary ────────────────────────────────────────────
const SPELLING = {
  "instaled":"installed","instalation":"installation","installion":"installation",
  "maintanance":"maintenance","maintenence":"maintenance","maintenace":"maintenance",
  "insepction":"inspection","inspecion":"inspection","inspction":"inspection",
  "commisioning":"commissioning","comissioning":"commissioning","commisoned":"commissioned",
  "opperational":"operational","operationl":"operational","operationel":"operational",
  "replacment":"replacement","replacemnt":"replacement","replacemet":"replacement",
  "equpment":"equipment","equipement":"equipment","equiment":"equipment",
  "verifed":"verified","varified":"verified","verrified":"verified",
  "sucesfully":"successfully","successfuly":"successfully","succesfuly":"successfully",
  "completd":"completed","complteed":"completed","completeed":"completed",
  "perfomed":"performed","preformed":"performed","performmed":"performed",
  "conduted":"conducted","conduceted":"conducted","conduected":"conducted",
  "restoerd":"restored","restred":"restored","restord":"restored",
  "elimanted":"eliminated","eliminaed":"eliminated","elimnated":"eliminated",
  "identfied":"identified","identifed":"identified","indentified":"identified",
  "alined":"aligned","alligned":"aligned","aligend":"aligned",
  "configred":"configured","configuerd":"configured","confgured":"configured",
  "tesed":"tested","testd":"tested","tessted":"tested",
  "moutned":"mounted","mountd":"mounted","mouted":"mounted",
  "conected":"connected","connectd":"connected","connnected":"connected",
  "disconected":"disconnected","disconnectd":"disconnected","disconnnected":"disconnected",
  "calibartion":"calibration","calibrtion":"calibration","calibertion":"calibration",
  "presure":"pressure","pressue":"pressure","presssure":"pressure",
  "tempereture":"temperature","temperture":"temperature","temperatue":"temperature",
  "fuctional":"functional","functionel":"functional","functonal":"functional",
  "assmbly":"assembly","assemby":"assembly","assembley":"assembly",
  "pneumtic":"pneumatic","pneumatc":"pneumatic","pnuematic":"pneumatic",
  "solinoid":"solenoid","solenod":"solenoid","solenied":"solenoid",
  "contamination":"contamination","contaminaton":"contamination","contaminaion":"contamination",
  "particulate":"particulate","particulte":"particulate","partculate":"particulate",
  "rectfied":"rectified","recitifed":"rectified","rectifed":"rectified",
  "operable":"operable","operble":"operable","operabel":"operable",
  "leakge":"leakage","leakeage":"leakage","leakege":"leakage",
  "mantled":"mantled","dismanteld":"dismantled","disamntled":"dismantled",
  "wirng":"wiring","wirig":"wiring","wireing":"wiring",
  "netork":"network","netwok":"network","netwrk":"network",
  "camrea":"camera","camara":"camera","caemra":"camera",
  "dispaly":"display","disply":"display","dsplay":"display",
  "acess":"access","acces":"access","acceess":"access",
  "swithc":"switch","swich":"switch","swtich":"switch",
  "pannel":"panel","panle":"panel","pnael":"panel",
  "arae":"area","arrea":"area","aea":"area",
  "gatee":"gate","gaet":"gate","gatte":"gate",
  "plantt":"plant","palnt":"plant","plnat":"plant",
  "workin":"working","workng":"working","wrking":"working",
  "haned":"handled","handeld":"handled","handeld":"handled",
  "chekced":"checked","chekd":"checked","chekced":"checked",
  "nessecary":"necessary","necesary":"necessary","necessray":"necessary",
  "chnages":"changes","changs":"changes","cahnges":"changes",
  "paramters":"parameters","parametrs":"parameters","parameeters":"parameters",
  "redings":"readings","readigns":"readings","readngs":"readings",
  "volum":"volume","voume":"volume","vloume":"volume",
  "enregy":"energy","enegy":"energy","engery":"energy",
  "cumultive":"cumulative","cumulatve":"cumulative","cumalative":"cumulative",
  "dialy":"daily","dayly":"daily","daly":"daily",
  "weeky":"weekly","weely":"weekly","weekley":"weekly",
  "montly":"monthly","monthley":"monthly","monthely":"monthly",
};

// ─── Casual → formal / technical vocabulary ─────────────────────────────────
const FORMAL_VOCAB = {
  "put in":"installed","put up":"installed","set up":"configured",
  "take out":"removed","took out":"removed","pull out":"extracted",
  "hooked up":"connected","hook up":"connect","plug in":"connected",
  "turned on":"powered on","turn on":"power on","switched on":"powered on",
  "turned off":"powered off","turn off":"power off","switched off":"powered off",
  "shut down":"shutdown","bring back":"restored","brought back":"restored",
  "carry out":"execute","carried out":"executed","sort out":"resolved",
  "sorted out":"resolved","find out":"determine","found out":"determined",
  "look into":"investigate","looked into":"investigated","check out":"inspect",
  "checked out":"inspected","make sure":"verify","went through":"reviewed",
  "go through":"review","write up":"document","wrote up":"documented",
  "fixed":"rectified","fix":"rectify","broke":"failed","broken":"inoperable",
  "bad":"defective","old":"worn","dirty":"contaminated","stuck":"seized",
  "loose":"unsecured","tight":"secured","clean":"serviceable",
  "okay":"operational","ok":"operational","fine":"satisfactory",
  "good":"satisfactory","great":"excellent","done":"completed",
  "tried":"attempted","got":"obtained","gave":"provided","sent":"transmitted",
  "told":"notified","showed":"demonstrated","saw":"observed","found":"identified",
  "noticed":"detected","used":"utilized","using":"utilizing","use":"utilize",
  "start":"initiate","started":"initiated","begin":"commence","began":"commenced",
  "end":"conclude","ended":"concluded","finish":"complete","finished":"completed",
  "check":"inspect","checked":"inspected","test":"verify","tested":"verified",
  "change":"replace","changed":"replaced","swap":"replace","swapped":"replaced",
  "mount":"install","mounted":"installed","hang":"mount","hung":"mounted",
  "drill":"perform drilling operations for","wire":"connect wiring for",
  "label":"apply identification labels to","labelled":"applied identification labels to",
  "reboot":"restart","rebooted":"restarted","reset":"reinitialised",
};

// ─── Abbreviation expansions ─────────────────────────────────────────────────
const ABBREVIATIONS = {
  "cctv":"Closed-Circuit Television (CCTV)","hdmi":"High-Definition Multimedia Interface (HDMI)",
  "usb":"Universal Serial Bus (USB)","lan":"Local Area Network (LAN)",
  "wan":"Wide Area Network (WAN)","pcb":"Printed Circuit Board (PCB)",
  "plc":"Programmable Logic Controller (PLC)","dcs":"Distributed Control System (DCS)",
  "scada":"Supervisory Control and Data Acquisition (SCADA)",
  "hmi":"Human Machine Interface (HMI)","gis":"Gas Insulated Switchgear (GIS)",
  "lng":"Liquefied Natural Gas (LNG)","rpm":"Revolutions Per Minute (RPM)",
  "vfd":"Variable Frequency Drive (VFD)","esp":"Electrostatic Precipitator (ESP)",
  "ptz":"Pan-Tilt-Zoom (PTZ)","poe":"Power over Ethernet (PoE)",
  "ups":"Uninterruptible Power Supply (UPS)","ap":"Access Point (AP)",
  "nvr":"Network Video Recorder (NVR)","dvr":"Digital Video Recorder (DVR)",
  "ip":"Internet Protocol (IP)","pdu":"Power Distribution Unit (PDU)",
  "ats":"Automatic Transfer Switch (ATS)","mcc":"Motor Control Centre (MCC)",
  "hvac":"Heating, Ventilation and Air Conditioning (HVAC)",
  "rtu":"Remote Terminal Unit (RTU)","io":"Input/Output (I/O)",
};

// ─── Outcome phrase enhancements ─────────────────────────────────────────────
const OUTCOMES = {
  "everything was okay":"all systems were confirmed to be operating within normal parameters",
  "everything okay":"all systems confirmed operational",
  "was okay":"was verified to be functioning correctly",
  "worked fine":"was confirmed to be operating as designed",
  "no issues":"no anomalies were detected",
  "no problem":"no faults were identified",
  "working well":"operating within acceptable parameters",
  "working properly":"functioning as per design specifications",
  "all good":"all systems confirmed operational",
  "back online":"restored to online operational status",
  "back to normal":"restored to normal operating condition",
  "up and running":"successfully commissioned and operational",
  "running fine":"operating normally without anomalies",
  "all working":"all systems confirmed operational",
  "work done":"work was completed successfully",
  "job done":"task was completed successfully",
};

// ─── Spell-fix a single word ──────────────────────────────────────────────────
function fixSpelling(word) {
  const lower = word.toLowerCase();
  if (SPELLING[lower]) {
    // Preserve capitalisation
    if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
      return SPELLING[lower].charAt(0).toUpperCase() + SPELLING[lower].slice(1);
    }
    return SPELLING[lower];
  }
  return word;
}

// ─── Apply formal vocabulary replacements (multi-word first) ─────────────────
function applyFormalVocab(text) {
  let r = text;
  const sorted = Object.entries(FORMAL_VOCAB).sort((a, b) => b[0].length - a[0].length);
  for (const [informal, formal] of sorted) {
    const escaped = informal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    r = r.replace(new RegExp("\\b" + escaped + "\\b", "gi"), (m) =>
      m[0] === m[0].toUpperCase() && m[0] !== m[0].toLowerCase()
        ? formal.charAt(0).toUpperCase() + formal.slice(1)
        : formal
    );
  }
  return r;
}

// ─── Expand abbreviations ────────────────────────────────────────────────────
function expandAbbreviations(text) {
  let r = text;
  const sorted = Object.entries(ABBREVIATIONS).sort((a, b) => b[0].length - a[0].length);
  for (const [abbr, full] of sorted) {
    const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Don't expand if already in parentheses context
    r = r.replace(new RegExp("(?<!\\()\\b" + escaped + "\\b(?![A-Z0-9\\-])", "gi"), full);
  }
  return r;
}

// ─── Apply outcome enhancements ───────────────────────────────────────────────
function applyOutcomes(text) {
  let r = text;
  const sorted = Object.entries(OUTCOMES).sort((a, b) => b[0].length - a[0].length);
  for (const [phrase, enhanced] of sorted) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    r = r.replace(new RegExp(escaped, "gi"), enhanced);
  }
  return r;
}

// ─── Spell-fix all words in a sentence ───────────────────────────────────────
function fixSpellingInText(text) {
  // Only fix standalone words, preserve model numbers, codes, etc.
  return text.replace(/\b([A-Za-z]+)\b/g, (word) => {
    // Skip if it looks like a model number or acronym (all caps + digits)
    if (/^[A-Z]{2,}[\d\-]/.test(word)) return word;
    if (/^\d/.test(word)) return word;
    return fixSpelling(word);
  });
}

// ─── Capitalise first letter of sentences ────────────────────────────────────
function capitaliseSentences(text) {
  return text
    .replace(/(^|\.\s+|:\s+)([a-z])/g, (_, p, l) => p + l.toUpperCase())
    .replace(/^([a-z])/, (l) => l.toUpperCase());
}

// ─── Add period at end if missing ────────────────────────────────────────────
function ensurePeriod(text) {
  const t = text.trim();
  if (!t) return t;
  if (/[.!?]$/.test(t)) return t;
  // Don't add period to model numbers, headings, or lines ending with a colon
  if (/[:\-]$/.test(t)) return t;
  if (/^[A-Z\d\-]+$/.test(t)) return t;
  return t + ".";
}

// ─── Fix spacing and punctuation ─────────────────────────────────────────────
function fixSpacing(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.,;:!?])(?=[A-Za-z])/g, "$1 ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\bthe the\b/gi, "the")
    .trim();
}

// ─── Process a single line ────────────────────────────────────────────────────
function enhanceLine(line) {
  let t = line.trim();
  if (!t) return "";

  // Preserve lines that are just model numbers / codes / "None" / "N/A"
  if (/^(None|N\/A|NA|nil)$/i.test(t)) return t;
  if (/^[A-Z]{2,}[\d\-][A-Z0-9\-]+$/i.test(t)) return t;
  if (/^\d+\.\s*(DS-|WL-|RG-|POE|MY\d|CHNT|HD\d|DS\d)/i.test(t)) return t;

  // Preserve "Results:" prefix lines but still enhance the content after it
  const resultsMatch = t.match(/^(Results?\s*:\s*)(.*)/i);
  if (resultsMatch) {
    const enhanced = enhanceLine(resultsMatch[2]);
    return "Results: " + (enhanced || resultsMatch[2]);
  }

  // Extract leading step number e.g. "1. " or "• "
  const stepMatch = t.match(/^(\d+\.\s*|•\s*|-\s*)/);
  const prefix = stepMatch ? stepMatch[1] : "";
  const content = stepMatch ? t.slice(prefix.length) : t;

  // Pipeline
  let r = content;
  r = fixSpellingInText(r);
  r = applyOutcomes(r);
  r = applyFormalVocab(r);
  r = expandAbbreviations(r);
  r = fixSpacing(r);
  r = capitaliseSentences(r);
  r = ensurePeriod(r);

  return prefix + r;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function paraphraseField(text) {
  if (!text || text.trim().length < 3) return text;
  return text
    .split("\n")
    .map(enhanceLine)
    .join("\n");
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
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"').trim();
}
