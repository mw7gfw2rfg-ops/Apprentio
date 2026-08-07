// Static, no-schema-change signal for "is this a Civil Service / national
// security employer" -- there's no structured field for it, and inferring
// from vacancies.sector isn't reliable (that column holds FAA's own route
// classification, not a clean government/private split; several routes,
// e.g. "Protective services", are shared with private-sector cybersecurity
// employers too). A small, explicit keyword list against employer_name is
// the honest option: it covers the named real cases in this app's own
// employer_sources ("GCHQ CyberFirst", "Civil Service Govt Security Cyber")
// and other unambiguous UK government bodies, without pretending to be a
// general classifier.
const GOVERNMENT_EMPLOYER_KEYWORDS = [
  "gchq",
  "civil service",
  "home office",
  "cabinet office",
  "ministry of defence",
  "ministry of justice",
  "foreign, commonwealth",
  "foreign commonwealth",
  "fcdo",
  "hmrc",
  "hm revenue",
  "hm treasury",
  "hm prison",
  "department for",
  "dwp",
  "security service",
  " mi5",
  " mi6",
  "secret intelligence service",
  "national crime agency",
  "government digital service",
  "met police",
  "metropolitan police",
  "police service",
];

export function isGovernmentEmployer(employerName: string): boolean {
  const name = ` ${employerName.toLowerCase()} `;
  return GOVERNMENT_EMPLOYER_KEYWORDS.some((keyword) => name.includes(keyword));
}
