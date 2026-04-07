import nlp from "compromise";

export const extractData = (text) => {

  let cleanText = text
    .replace(/\r/g, "\n")
    .replace(/\n+/g, "\n");

  const flatText = cleanText.replace(/\n/g, " ");

  // EMAIL
  const emailMatch = flatText.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );

  // PHONE
  const phoneMatch = flatText.match(
    /(\+91[\-\s]?)?[6-9]\d{9}/
  );

  // NAME
  let name = "";
  const lines = cleanText.split("\n").map(l => l.trim()).filter(Boolean);

  for (let line of lines.slice(0, 10)) {
    if (
      line.length < 30 &&
      /^[A-Za-z.\s]+$/.test(line) &&
      !line.toLowerCase().includes("email")
    ) {
      name = line;
      break;
    }
  }

  if (!name) {
    name = nlp(flatText).people().out("array")[0] || "";
  }

  // LOCATION
  const cities = ["delhi","mumbai","bangalore","hyderabad","pune","jaipur","chennai","india"];
  let location = "";

  for (let city of cities) {
    if (flatText.toLowerCase().includes(city)) {
      location = city;
      break;
    }
  }

  // COMPANY
  let company = "";
  const expSection = flatText.match(/(experience)([\s\S]*?)(education|skills)/i);

  if (expSection) {
    const expText = expSection[2];
    const matches = expText.match(/([A-Z][A-Za-z0-9&.\s]+)(:|-)/g);

    if (matches) {
      company = matches[matches.length - 1]
        .replace(/[:\-]/g, "")
        .trim();
    }
  }

  return {
    name,
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
    location,
    company
  };
};