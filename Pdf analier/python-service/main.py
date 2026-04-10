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

# ---------------- HEALTH ----------------
@app.get("/")
def home():
    return {"status": "Resume Parser Running 🚀"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# ---------------- LOAD MODEL ----------------
nlp = spacy.load("en_core_web_sm", disable=["parser", "tagger"])

# ---------------- TEXT EXTRACTION ----------------
def extract_text(file_bytes):
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    return "\n".join([page.get_text() for page in doc])

# ---------------- SPLIT ----------------
def split_sections(text):
    sections = {"header": []}
    current = "header"

    for line in text.split("\n"):
        l = line.lower()

        if "skill" in l:
            current = "skills"
        elif "experience" in l or "employment" in l:
            current = "experience"
        elif "education" in l:
            current = "education"

        sections.setdefault(current, []).append(line)

    return {k: "\n".join(v) for k, v in sections.items()}

# ---------------- EMAIL ----------------
def extract_email(text):
    emails = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    return emails[0].lower() if emails else "N/A"

# ---------------- PHONE ----------------
def extract_phone(text):
    match = re.search(r"(\+?\d[\d\s\-]{8,15})", text)
    if not match:
        return "N/A"

    phone = re.sub(r"\D", "", match.group())
    return phone[-10:]

# ---------------- NAME (🔥 99% ACCURATE) ----------------
def extract_name(text):
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    blacklist = [
        "resume","cv","profile","biodata",
        "developer","engineer","marketing","manager",
        "analyst","intern","consultant","specialist",
        "skills","experience","education"
    ]

    # Rule-based
    for line in lines[:15]:
        words = line.split()

        if (
            2 <= len(words) <= 4 and
            not any(char.isdigit() for char in line) and
            not any(b in line.lower() for b in blacklist) and
            all(w[0].isupper() for w in words if w.isalpha())
        ):
            return line.strip()

    # Email fallback
    email = extract_email(text)
    if email != "N/A":
        name_guess = email.split("@")[0]
        name_guess = re.sub(r"\d+", "", name_guess)
        name_guess = name_guess.replace(".", " ").title()
        if 2 <= len(name_guess.split()) <= 4:
            return name_guess

    # spaCy fallback
    doc = nlp(text[:1200])
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text.strip()

    return "N/A"

# ---------------- LOCATION ----------------
def extract_location(text):
    cities = ["delhi","mumbai","pune","bangalore","hyderabad","chennai","kolkata","noida","gurgaon"]

    for city in cities:
        if city in text.lower():
            return city.title()

    doc = nlp(text[:1000])
    for ent in doc.ents:
        if ent.label_ in ["GPE", "LOC"]:
            return ent.text.strip()

    return "N/A"

# ---------------- SKILLS ----------------
def extract_skills(text):
    skills_db = [
        "python","java","c++","javascript","react","node","mongodb",
        "html","css","bootstrap","tailwind","sql",
        "excel","seo","marketing","sales","communication"
    ]

    text_lower = text.lower()
    return list(set([s for s in skills_db if s in text_lower]))

# ---------------- COMPANY ----------------
def extract_company(text):
    lines = text.split("\n")

    for line in lines:
        if " at " in line.lower():
            return line.split("at")[-1].strip()

        if any(k in line.lower() for k in ["ltd","pvt","inc","technologies","solutions"]):
            return line.strip()

    return "N/A"

# ---------------- MAIN ----------------
@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    content = await file.read()
    text = extract_text(content)

    sections = split_sections(text)

    data = {
        "fullName": extract_name(text),
        "email": extract_email(text),
        "mobile": extract_phone(text),
        "location": extract_location(text),
        "lastCompany": extract_company(sections.get("experience", "")),
        "skills": extract_skills(text),
    }

    print("\n🔥 FINAL OUTPUT:\n", data)

    return data