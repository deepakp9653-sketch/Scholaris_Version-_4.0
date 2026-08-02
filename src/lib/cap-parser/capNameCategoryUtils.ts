export function parseCapCandidateNameSync(
  rawName: string,
  mode: "SURNAME_FIRST" | "FIRST_NAME_FIRST" = "SURNAME_FIRST"
) {
  const parts = rawName.trim().split(/\s+/);
  if (parts.length === 0) {
    return { surname: "", firstName: "", fatherInName: "", fatherFullName: "" };
  }
  if (parts.length === 1) {
    return { surname: parts[0], firstName: parts[0], fatherInName: "", fatherFullName: parts[0] };
  }
  if (parts.length === 2) {
    if (mode === "FIRST_NAME_FIRST") {
      return { firstName: parts[0], surname: parts[1], fatherInName: parts[1], fatherFullName: parts[1] };
    }
    return { surname: parts[0], firstName: parts[1], fatherInName: parts[0], fatherFullName: parts[0] };
  }

  let surname = "";
  let firstName = "";
  let fatherInName = "";

  if (mode === "SURNAME_FIRST") {
    // Format: [Surname] [First Name] [Father Name]
    // Example: KAMTHE ADITYA DILIP
    surname = parts[0];
    firstName = parts[1];
    fatherInName = parts.slice(2).join(" ");
  } else {
    // Format: [First Name] [Father Name] [Surname]
    // Example: ADITYA DILIP KAMTHE
    firstName = parts[0];
    fatherInName = parts[1];
    surname = parts.slice(2).join(" ");
  }

  const fatherFullName = `${fatherInName} ${surname}`.trim();
  return { surname, firstName, fatherInName, fatherFullName };
}

export function mapCapCategorySync(raw: string | null): string {
  if (!raw) return "Open";
  const clean = raw.trim().toUpperCase().replace(/[\$#]/g, "");
  if (clean.includes("OPEN")) return "Open";
  if (clean.includes("OBC")) return "OBC";
  if (clean.includes("SC")) return "SC";
  if (clean.includes("ST")) return "ST";
  if (clean.includes("EWS")) return "EWS";
  if (clean.includes("SEBC")) return "SEBC";
  if (clean.includes("SBC")) return "SBC";
  if (clean.includes("NT 1") || clean.includes("NT-B") || clean.includes("NT1")) return "NT1";
  if (clean.includes("NT 2") || clean.includes("NT-C") || clean.includes("NT2")) return "NT2";
  if (clean.includes("NT 3") || clean.includes("NT-D") || clean.includes("NT3")) return "NT3";
  if (clean.includes("VJ") || clean.includes("DT") || clean.includes("DT/VJ")) return "VJ";
  return "Open";
}
