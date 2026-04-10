from fastapi import FastAPI, UploadFile, File
import re
import fitz
import spacy
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- ROOT (🔥 FIX FOR CRON) ----------------
@app.get("/")
def home():
    return {"status": "Python Resume Parser Running 🚀"}

# ---------------- HEALTH CHECK ----------------
@app.get("/health")
def health():
    return {"status": "healthy"}

# ---------------- LOAD SPACY ----------------
nlp = spacy.load("en_core_web_sm", disable=["parser", "tagger"])

# ---------------- TEXT EXTRACTION ----------------
def extract_text(file_bytes):
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    return "\n".join([page.get_text() for page in doc])

# ---------------- SECTION SPLITTER ----------------
def split_sections(text):
    sections = {"header": []}
    current = "header"

    for line in text.split("\n"):
        l = line.lower()

        if "skill" in l:
            current = "skills"
        elif "experience" in l or "employment" in l or "work" in l:
            current = "experience"
        elif "education" in l or "qualification" in l:
            current = "education"

        sections.setdefault(current, []).append(line)

    return {k: "\n".join(v) for k, v in sections.items()}

# ---------------- NAME ----------------
def extract_name(text):
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    blacklist = ["resume", "cv", "profile", "biodata"]

    for line in lines[:5]:
        if (
            2 <= len(line.split()) <= 4 and
            not any(char.isdigit() for char in line) and
            not any(b in line.lower() for b in blacklist)
        ):
            return line.title()

    doc = nlp(text[:500])
    for ent in doc.ents:
        if ent.label_ == "PERSON" and len(ent.text.split()) <= 4:
            return ent.text.strip()

    return "N/A"

# ---------------- EMAIL ----------------
def extract_email(text):
    text = re.sub(r"\s*@\s*", "@", text)
    text = re.sub(r"\s*\.\s*", ".", text)
    text = text.replace("\n", " ").replace("\t", " ")

    emails = re.findall(
        r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
        text
    )

    if not emails:
        return None

    clean_emails = list(set([e.lower().strip() for e in emails]))

    for email in clean_emails:
        if not any(x in email for x in ["noreply", "example", "test"]):
            return email

    return clean_emails[0]

# ---------------- PHONE ----------------
def extract_phone(text):
    match = re.search(r"(\+?\d[\d\s\-]{8,15})", text)

    if not match:
        return None

    phone = re.sub(r"\D", "", match.group(0))

    if phone.startswith("91") and len(phone) > 10:
        phone = phone[-10:]

    return phone

# ---------------- LOCATION ----------------
def extract_location(text):
    text_lower = text.lower()

    indian_cities = [
        "delhi","new delhi","mumbai","pune","bangalore","bengaluru",
        "hyderabad","chennai","kolkata","ahmedabad","jaipur","lucknow",
        "kanpur","nagpur","indore","bhopal","patna","surat","agra",
        "noida","gurgaon","gurugram","faridabad","ghaziabad",
        "chandigarh","coimbatore","kochi","trivandrum","vizag",
        "visakhapatnam","madurai","varanasi","meerut","ranchi"
    ]

    for city in indian_cities:
        if city in text_lower:
            return city.title()

    if re.search(r"\b\d{6}\b", text):
        return "India"

    doc = nlp(text[:1000])

    for ent in doc.ents:
        if ent.label_ in ["GPE", "LOC"]:
            val = ent.text.strip()
            if len(val) > 2 and val.isalpha():
                return val

    return "N/A"

# ---------------- SKILLS ----------------
def extract_skills(text):
    words = re.findall(r"[A-Za-z\+\#\.]+", text.lower())

    common_skills = [
        "communication","sales","marketing","seo","excel","word",
        "python","java","c++","javascript","react","node",
        "management","leadership","analysis","customer","support"
    ]

    return list(set([w for w in words if w in common_skills]))

# ---------------- COMPANY ----------------
def extract_company(exp_text):
    lines = [l.strip() for l in exp_text.split("\n") if l.strip()]

    for line in lines:
        lower = line.lower()

        if any(x in lower for x in ["experience", "work", "employment"]):
            continue

        match = re.search(r"(?:at|@)\s+(.+)", line, re.IGNORECASE)
        if match:
            return match.group(1).strip()

        if any(s in lower for s in ["pvt", "ltd", "limited", "inc"]):
            return line.strip()

    return "N/A"

# ---------------- MAIN API ----------------
@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    content = await file.read()
    text = extract_text(content)

    sections = split_sections(text)

    data = {
        "fullName": extract_name(sections.get("header", "")),
        "email": extract_email(text) or "N/A",
        "mobile": extract_phone(text) or "N/A",
        "location": extract_location(text) or "N/A",
        "lastCompany": extract_company(sections.get("experience", "")),
        "skills": extract_skills(text),
    }

    print("\n🔥 FINAL OUTPUT:\n", data)

    return data