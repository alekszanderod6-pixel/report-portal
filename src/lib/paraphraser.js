var RULES = [
  { find: /^(\d+)\.\s*Inspected?\s+(.+)/im, to: "$1. $2. Inspected to verify operational status and confirm no visible defects or anomalies." },
  { find: /^(\d+)\.\s*Installed?\s+(.+)/im, to: "$1. $2. Installed as per design specifications and manufacturer requirements." },
  { find: /^(\d+)\.\s*Replaced?\s+(.+)/im, to: "$1. $2. Replaced with the correct specification replacement unit." },
  { find: /^(\d+)\.\s*Cleaned?\s+(.+)/im, to: "$1. Performed cleaning of $2 to maintain operational cleanliness and prevent degradation." },
  { find: /^(\d+)\.\s*Tested?\s+(.+)/im, to: "$1. Conducted testing and verification of $2 to confirm proper functionality." },
  { find: /^(\d+)\.\s*Troubleshoot?\s+(.+)/im, to: "$1. Performed troubleshooting and fault diagnosis on $2 to identify root cause and implement corrective action." },
  { find: /^(\d+)\.\s*Configured?\s+(.+)/im, to: "$1. Configured $2 with the required parameters and communication settings." },
  { find: /^(\d+)\.\s*Removed?\s+(.+)/im, to: "$1. Safely removed $2 following proper isolation and safety procedures." },
  { find: /^(\d+)\.\s*Restored?\s+(.+)/im, to: "$1. Successfully restored $2 to full operational status." },
  { find: /^(\d+)\.\s*Conducted?\s+(.+)/im, to: "$1. $2 was executed as per standard operating procedures." },
  { find: /^(\d+)\.\s*Repaired?\s+(.+)/im, to: "$1. Performed repair on $2 to restore functionality to acceptable standards." },
  { find: /^(\d+)\.\s*Monitored?\s+(.+)/im, to: "$1. Monitored $2 continuously to track performance and detect any deviations." },
  { find: /^(\d+)\.\s*Commissioned?\s+(.+)/im, to: "$1. Commissioned $2 and verified all operational parameters meet design specifications." },
  { find: /^(\d+)\.\s*Connected?\s+(.+)/im, to: "$1. Established connection for $2 as per the wiring diagrams and connection specifications." },
  { find: /^(\d+)\.\s*Disconnected?\s+(.+)/im, to: "$1. Safely disconnected $2 following proper de-energization procedures." },
  { find: /^(\d+)\.\s*Calibrated?\s+(.+)/im, to: "$1. Performed calibration and adjustment of $2 to ensure readings are within acceptable tolerance ranges." },
  { find: /^(\d+)\.\s*Logged?\s+(.+)/im, to: "$1. Recorded and documented all parameters of $2 for reference and future analysis." },
  { find: /^(\d+)\.\s*Identified?\s+(.+)/im, to: "$1. Identified $2 during routine inspection and documented the finding for further action." },
  { find: /^(\d+)\.\s*Wired?\s+(.+)/im, to: "$1. Performed wiring and cabling for $2 as per the wiring diagrams and specifications." }
];

var PHRASES = {
  "power was restored": "Power supply was successfully restored to all affected equipment",
  "everything working": "All systems confirmed operational within design parameters",
  "everything was okay": "All systems were verified to be operating within normal parameters",
  "everything okay": "All systems confirmed operational",
  "no issues": "No anomalies or faults were detected during inspection",
  "no problem": "No faults or defects were identified",
  "working fine": "Operating normally within acceptable parameters",
  "working properly": "Functioning as per design specifications",
  "back online": "Were successfully brought back online",
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
  "good condition": "Satisfactory operational condition",
  "everything is fine": "All systems are confirmed to be in satisfactory condition",
  "no problem at all": "No anomalies or faults were detected",
  "is fine": "Is confirmed to be in satisfactory condition",
  "perfectly": "to the required specifications"
};

function tryRule(text) {
  for (var i = 0; i < RULES.length; i++) {
    if (RULES[i].find.test(text)) return text.replace(RULES[i].find, RULES[i].to);
  }
  return null;
}

function tryPhrase(text) {
  var lower = text.toLowerCase();
  for (var key in PHRASES) {
    if (lower.indexOf(key) !== -1) {
      return text.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi", PHRASES[key]);
    }
  }
  return null;
}

function enhanceLine(text) {
  var t = text.trim();
  if (!t) return null;
  if (/^Results?\s*:/i.test(t)) return null;
  if (/^\d+\.?\s*$/i.test(t)) return null;
  if (/^[A-Z]{2,}[-\s]?\d{2,}[A-Z0-9\-]*$/i.test(t)) return null;
  if (/^(None|N\/A|NA|nil)$/i.test(t)) return null;
  if (/\d+\.\s*(DS-|WL-|POE|MY\d|CHNT|HD\d|CFM-)/i.test(t)) return null;
  if (/^\d+\.\s+(?:\*|-|\u2022|\u25CF|\u25CB)/.test(t)) return null;
  if (t.length < 10) return null;
  var result = tryRule(t);
  if (result) return result;
  result = tryPhrase(t);
  if (result) return result;
  return null;
}

export function paraphraseField(text) {
  if (!text || text.trim().length < 10) return null;
  var lines = text.split("\n");
  var result = [];
  var anyChanged = false;
  for (var i = 0; i < lines.length; i++) {
    var enhanced = enhanceLine(lines[i]);
    if (enhanced !== null) {
      result.push(enhanced);
      anyChanged = true;
    } else {
      result.push(lines[i]);
    }
  }
  if (!anyChanged) return null;
  return result.join("\n");
}

export function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim();
}
