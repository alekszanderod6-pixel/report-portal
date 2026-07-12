
var DOMAINS = {
  cctv: { words: ["camera","cameras","cctv","surveillance","monitoring","dvr","nvr","ivms","recorder","footage","ptz","dome","bullet","hikvision","dahua"],
    context: "CCTV/surveillance" },
  electrical: { words: ["power","voltage","current","breaker","fuse","transformer","panel","wiring","cable","relay","contactor","mcb","ac","dc","ups"],
    context: "electrical" },
  instrument: { words: ["sensor","transmitter","calibrat","gauge","pressure","temperature","flow","level","analyzer","spectrometer"," plc","dcs","scada","hmi","loop","4-20ma"],
    context: "instrumentation & control" },
  mechanical: { words: ["pump","valve","motor","bearing","seal","gasket","pipe","filter","coupling","gearbox","belt","fan","blower","compressor","turbine"],
    context: "mechanical" },
  it: { words: ["network","router","switch","access point","wifi","ethernet","ip","server","fiber","radio","antenna","poe","vlan","firewall"],
    context: "IT/communications" },
  water: { words: ["water","treatment","reverse osmosis","demineraliz","filtration","chlorination","tank","pump","membrane","flow rate","tds","ph"],
    context: "water treatment" }
};

var SMART_RULES = [
  { find: /^(\d+)\.\s*(?:Inspected?|Checked?|Examined?|Looked\s+at|Visited?|Patrolled?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". " + m[2].charAt(0).toUpperCase() + m[2].slice(1).replace(/\.\s*$/, "") + ". Inspected to verify operational status and confirm no visible defects or anomalies."; }},
  { find: /^(\d+)\.\s*(?:Installed?|Mounted?|Fixed?|Set\s+up?|Placed?|Fitted?|Attached?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". " + m[2].charAt(0).toUpperCase() + m[2].slice(1).replace(/\.\s*$/, "") + " was installed as per design specifications and manufacturer requirements."; }},
  { find: /^(\d+)\.\s*(?:Replaced?|Changed?|Swapped?|Exchanged?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". " + m[2].charAt(0).toUpperCase() + m[2].slice(1).replace(/\.\s*$/, "") + " was replaced with the correct specification replacement unit."; }},
  { find: /^(\d+)\.\s*(?:Cleaned?|Washed?|Wiped?|Dusted?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Performed cleaning of " + m[2].replace(/\.\s*$/, "").toLowerCase() + " to maintain operational cleanliness and prevent degradation."; }},
  { find: /^(\d+)\.\s*(?:Tested?|Verified?|Confirmed?|Checked?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Conducted testing and verification of " + m[2].replace(/\.\s*$/, "").toLowerCase() + " to confirm proper functionality and compliance."; }},
  { find: /^(\d+)\.\s*(?:Troubleshoot?|Diagnos?|Investigated?|Debugged?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Performed troubleshooting and fault diagnosis on " + m[2].replace(/\.\s*$/, "").toLowerCase() + " to identify root cause and implement corrective action."; }},
  { find: /^(\d+)\.\s*(?:Configured?|Set\s+up?|Programmed?|Setup?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Configured " + m[2].replace(/\.\s*$/, "").toLowerCase() + " with the required parameters and communication settings."; }},
  { find: /^(\d+)\.\s*(?:Removed?|Dismantled?|Disconnected?|Isolated?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Safely removed " + m[2].replace(/\.\s*$/, "").toLowerCase() + " following proper isolation and safety procedures."; }},
  { find: /^(\d+)\.\s*(?:Restored?|Recovered?|Returned?|Brought\s+back?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Successfully restored " + m[2].replace(/\.\s*$/, "").toLowerCase() + " to full operational status."; }},
  { find: /^(\d+)\.\s*(?:Conducted?|Carried\s+out?|Performed?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". " + m[2].charAt(0).toUpperCase() + m[2].slice(1).replace(/\.\s*$/, "") + " was executed as per standard operating procedures."; }},
  { find: /^(\d+)\.\s*(?:Repaired?|Fixed?|Rectified?|Mended?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Performed repair on " + m[2].replace(/\.\s*$/, "").toLowerCase() + " to restore functionality to acceptable standards."; }},
  { find: /^(\d+)\.\s*(?:Monitored?|Observed?|Watched?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Monitored " + m[2].replace(/\.\s*$/, "").toLowerCase() + " continuously to track performance and detect any deviations."; }},
  { find: /^(\d+)\.\s*(?:Commissioned?|Activated?|Energized?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Commissioned " + m[2].replace(/\.\s*$/, "").toLowerCase() + " and verified all operational parameters meet design specifications."; }}
];

var IMPROVEMENTS = {
  "power was restored": "Power supply was successfully restored to all affected equipment",
  "power restored": "Power supply was successfully restored",
  "everything working": "All systems confirmed operational within design parameters",
  "everything was okay": "All systems were verified to be operating within normal parameters",
  "everything okay": "All systems confirmed operational",
  "no issues": "No anomalies or faults were detected during inspection",
  "no problem": "No faults or defects were identified",
  "working fine": "Operating normally within acceptable parameters",
  "working properly": "Functioning as per design specifications",
  "back online": "Successfully restored to online operational status",
  "back to normal": "Restored to normal operating condition",
  "up and running": "Successfully commissioned and operational",
  "workdone successfully": "Work was completed successfully",
  "work done successfully": "Work was completed successfully",
  "workdone": "Work was completed successfully",
  "work done": "Work was completed successfully",
  "all good": "All systems confirmed operational",
  "in good shape": "In satisfactory operational condition",
  "no errors": "No error conditions were detected during testing",
  "no faults": "No fault conditions were identified",
  "looks good": "Visual inspection confirmed satisfactory condition",
  "was okay": "Was verified to be functioning correctly",
  "went online": "Were successfully brought back online",
  "went back online": "Were successfully restored to online status",
  "good condition": "Satisfactory operational condition"
};

function detectDomain(text) {
  var lower = text.toLowerCase();
  var scores = {};
  var keys = Object.keys(DOMAINS);
  for (var i = 0; i < keys.length; i++) {
    var name = keys[i];
    var words = DOMAINS[name].words;
    var score = 0;
    for (var j = 0; j < words.length; j++) {
      if (lower.indexOf(words[j]) !== -1) score++;
    }
    scores[name] = score;
  }
  var best = "";
  var bestScore = 0;
  for (var k in scores) {
    if (scores[k] > bestScore) { bestScore = scores[k]; best = k; }
  }
  return best ? DOMAINS[best] : null;
}

function improveSentence(text) {
  for (var i = 0; i < SMART_RULES.length; i++) {
    var rule = SMART_RULES[i];
    if (rule.find.test(text)) {
      return rule.rewrite(text);
    }
  }
  for (var key in IMPROVEMENTS) {
    if (text.toLowerCase().indexOf(key) !== -1) {
      return IMPROVEMENTS[key];
    }
  }
  return text;
}

function enhanceLine(text) {
  var t = text.trim();
  if (!t) return "";
  if (/^Results?\s*:/i.test(t)) return t;
  if (/^\d+\.?\s*$/i.test(t)) return t;
  if (/^[A-Z]{2,}[-\s]?\d{2,}[A-Z0-9\-]*$/i.test(t)) return t;
  if (/^(None|N\/A|NA|nil)$/i.test(t)) return t;
  if (/\d+\.\s*(DS-|WL-|POE|MY\d|CHNT|HD\d|CFM-)/i.test(t)) return t;
  if (/^\d+\.\s+(?:\*|-|\u2022|\u25CF)/.test(t)) return t;
  return improveSentence(t);
}

export function paraphraseField(text) {
  if (!text || text.trim().length < 3) return text;
  var domain = detectDomain(text);
  var lines = text.split("\n");
  var result = [];
  for (var i = 0; i < lines.length; i++) {
    result.push(enhanceLine(lines[i]));
  }
  var output = result.join("\n");
  if (domain) {
    output += "\n\n[Domain: " + domain.context + " detected]";
  }
  return output;
}

export function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim();
}
