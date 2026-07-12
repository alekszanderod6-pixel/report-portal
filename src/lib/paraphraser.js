var SMART_RULES = [
  { find: /^(\d+)\.\s*(?:Inspected?|Checked?|Examined?|Looked\s+at|Visited?|Patrolled?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". " + m[2].charAt(0).toUpperCase() + m[2].slice(1).replace(/\.\s*$/, "") + ". Inspected to verify operational status and confirm no visible defects."; }},
  { find: /^(\d+)\.\s*(?:Installed?|Mounted?|Fixed?|Set\s+up?|Placed?|Fitted?|Attached?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". " + m[2].charAt(0).toUpperCase() + m[2].slice(1).replace(/\.\s*$/, "") + ". Installed as per design specifications and manufacturer requirements."; }},
  { find: /^(\d+)\.\s*(?:Replaced?|Changed?|Swapped?|Exchanged?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". " + m[2].charAt(0).toUpperCase() + m[2].slice(1).replace(/\.\s*$/, "") + " was replaced with the correct specification replacement unit."; }},
  { find: /^(\d+)\.\s*(?:Cleaned?|Washed?|Wiped?|Dusted?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Performed cleaning of " + m[2].replace(/\.\s*$/, "").toLowerCase() + " to maintain operational cleanliness and prevent degradation."; }},
  { find: /^(\d+)\.\s*(?:Tested?|Verified?|Confirmed?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Conducted testing and verification of " + m[2].replace(/\.\s*$/, "").toLowerCase() + " to confirm proper functionality."; }},
  { find: /^(\d+)\.\s*(?:Troubleshoot?|Diagnos?|Investigated?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Performed troubleshooting and fault diagnosis on " + m[2].replace(/\.\s*$/, "").toLowerCase() + " to identify root cause and implement corrective action."; }},
  { find: /^(\d+)\.\s*(?:Configured?|Set\s+up?|Programmed?)\s+(.+)/im,
    rewrite: function(m) { return m[1] ". Configured " + m[2].replace(/\.\s*$/, "").toLowerCase() + " with the required parameters and communication settings."; }},
  { find: /^(\d+)\.\s*(?:Removed?|Dismantled?|Disconnected?|Isolated?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Safely removed " + m[2].replace(/\.\s*$/, "").toLowerCase() + " following proper isolation and safety procedures."; }},
  { find: /^(\d+)\.\s*(?:Restored?|Recovered?|Returned?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Successfully restored " + m[2].replace(/\.\s*$/, "").toLowerCase() + " to full operational status."; }},
  { find: /^(\d+)\.\s*(?:Conducted?|Carried\s+out?|Performed?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". " + m[2].charAt(0).toUpperCase() + m[2].slice(1).replace(/\.\s*$/, "") + " was executed as per standard operating procedures."; }},
  { find: /^(\d+)\.\s*(?:Repaired?|Fixed?|Rectified?|Mended?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Performed repair on " + m[2].replace(/\.\s*$/, "").toLowerCase() + " to restore functionality to acceptable standards."; }},
  { find: /^(\d+)\.\s*(?:Monitored?|Observed?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Monitored " + m[2].replace(/\.\s*$/, "").toLowerCase() + " continuously to track performance and detect any deviations."; }},
  { find: /^(\d+)\.\s*(?:Commissioned?|Activated?|Energized?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Commissioned " + m[2].replace(/\.\s*$/, "").toLowerCase() + " and verified all operational parameters meet design specifications."; }},
  { find: /^(\d+)\.\s*(?:Connected?|Wired?|Plugged?|Hooked\s+up?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Established connection for " + m[2].replace(/\.\s*$/, "").toLowerCase() + " as per the wiring diagrams and connection specifications."; }},
  { find: /^(\d+)\.\s*(?:Disconnected?|Unplugged?|Unhooked?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Safely disconnected " + m[2].replace(/\.\s*$/, "").toLowerCase() + " following proper de-energization procedures."; }},
  { find: /^(\d+)\.\s*(?:Calibrated?|Adjusted?|Tuned?|Aligned?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Performed calibration and adjustment of " + m[2].replace(/\.\s*$/, "").toLowerCase() + " to ensure readings are within acceptable tolerance ranges."; }},
  { find: /^(\d+)\.\s*(?:Logged?|Recorded?|Documented?|Noted?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Recorded and documented all parameters of " + m[2].replace(/\.\s*$/, "").toLowerCase() + " for reference and future analysis."; }},
  { find: /^(\d+)\.\s*(?:Identified?|Noticed?|Discovered?|Found?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Identified " + m[2].replace(/\.\s*$/, "").toLowerCase() + " during routine inspection and documented the finding for further action."; }},
  { find: /^(\d+)\.\s*(?:Assigned?|Allocated?|Appointed?|Deployed?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Was assigned to " + m[2].replace(/\.\s*$/, "").toLowerCase() + " for execution and follow-up."; }},
  { find: /^(\d+)\.\s*(?:Retrofitted?|Upgraded?|Modernized?|Converted?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Performed retrofit and upgrade of " + m[2].replace(/\.\s*$/, "").toLowerCase() + " to meet current operational standards."; }},
  { find: /^(\d+)\.\s*(?:Repaired?|Fixed?|Rectified?|Mended?)\s+(.+)/im,
    rewrite: function(m) { return m[1] + ". Performed repair on " + m[2].replace(/\.\s*$/, "").toLowerCase() + " to restore functionality to acceptable standards."; }}
];

var IMPROVEMENTS = {
  "power was restored": "Power supply was successfully restored to all affected equipment",
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
  "good condition": "Satisfactory operational condition",
  "everything is fine": "All systems are confirmed to be in satisfactory condition",
  "no problem at all": "No anomalies or faults were detected"
};

function improveSentence(text) {
  for (var i = 0; i < SMART_RULES.length; i++) {
    if (SMART_RULES[i].find.test(text)) return SMART_RULES[i].rewrite(text);
  }
  for (var key in IMPROVEMENTS) {
    if (text.toLowerCase().indexOf(key) !== -1) {
      return text.replace(key, IMPROVEMENTS[key]);
    }
  }
  return null;
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
  var lines = text.split("\n");
  var result = [];
  var changed = false;
  for (var i = 0; i < lines.length; i++) {
    var enhanced = enhanceLine(lines[i]);
    result.push(enhanced);
    if (enhanced !== lines[i]) changed = true;
  }
  if (!changed) return null;
  return result.join("\n");
}

export function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim();
}