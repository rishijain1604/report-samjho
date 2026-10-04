const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeReport(extractedText, language = 'Hindi') {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const langInstruction = language === 'Hindi'
        ? 'Respond ONLY in simple Hindi (Devanagari script). Use simple everyday words a normal Indian person can understand. Avoid all medical jargon.'
        : 'Respond ONLY in simple English. Use simple words that a person with no medical background can understand.';

    const prompt = `
You are a helpful medical report explainer for Indian patients.
${langInstruction}

A patient has uploaded their medical report. Here is the extracted text:
---
${extractedText}
---

Analyze this report and identify ALL test values present. For EVERY test found, determine if it is normal, high, or low.

Cover ALL possible tests including but not limited to:

BLOOD TESTS: Hemoglobin, RBC, WBC, Platelets, HCT, MCV, MCH, MCHC, Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils, ESR, Reticulocyte Count
DIABETES: Fasting Blood Sugar, PP Blood Sugar, Random Blood Sugar, HbA1c, Insulin, C-Peptide, HOMA-IR
THYROID: TSH, T3, T4, Free T3, Free T4, Anti-TPO, Anti-TG, Thyroglobulin
LIPID PROFILE: Total Cholesterol, HDL, LDL, VLDL, Triglycerides, LDL/HDL Ratio, Non-HDL Cholesterol
LIVER: SGOT/AST, SGPT/ALT, ALP, GGT, Total Bilirubin, Direct Bilirubin, Indirect Bilirubin, Total Protein, Albumin, Globulin, A/G Ratio
KIDNEY: Creatinine, BUN, Uric Acid, eGFR, Cystatin C, Sodium, Potassium, Chloride, Bicarbonate, Calcium, Phosphorus, Magnesium
VITAMINS & MINERALS: Vitamin D (25-OH), Vitamin B12, Folate, Vitamin B9, Iron, TIBC, Ferritin, Transferrin Saturation, Zinc, Copper, Selenium
CARDIAC: Troponin I, Troponin T, CK-MB, LDH, BNP, NT-proBNP, Myoglobin, hs-CRP, Homocysteine
HORMONES: Testosterone (Total & Free), Estrogen, Progesterone, LH, FSH, Prolactin, DHEA-S, Cortisol, ACTH, Growth Hormone, IGF-1, AMH, Inhibin B
INFLAMMATION: CRP, ESR, Ferritin, Fibrinogen, IL-6, TNF-alpha, Procalcitonin
AUTOIMMUNE: ANA, Anti-dsDNA, Rheumatoid Factor, Anti-CCP, ANCA, Complement C3/C4, Anti-SSA, Anti-SSB
CANCER MARKERS: PSA (Prostate), CA-125 (Ovarian), CEA (Colon), AFP (Liver), CA 19-9 (Pancreas), CA 15-3 (Breast), Beta-HCG, LDH, NSE, S100
INFECTION & IMMUNITY: Widal Test, Dengue NS1, Dengue IgM/IgG, Malaria Antigen, HIV Ag/Ab, HBsAg, HCV, VDRL, ASO Titre, Typhidot
COAGULATION: PT, INR, APTT, Fibrinogen, D-Dimer, TT, Platelet Function
URINE: Glucose, Protein, Blood, Ketones, Bilirubin, Urobilinogen, pH, Specific Gravity, WBC, RBC, Casts, Crystals, Bacteria
STOOL: Occult Blood, Ova & Parasite, H.pylori Antigen, Calprotectin, Lactoferrin
ALLERGY: Total IgE, Specific IgE, RAST
BONE: ALP, Calcium, Phosphorus, PTH, Osteocalcin, CTx, Vitamin D
PANCREAS: Amylase, Lipase, Insulin, C-Peptide
NUTRITION: Prealbumin, Albumin, Total Protein, BMI-related

For ANY test found in the report, explain it in simple language.

Respond ONLY with this exact JSON (no extra text):
{
  "summary": "2-3 line simple summary of the overall report and health status",
  "keyFindings": [
    "Finding 1",
    "Finding 2",
    "Finding 3"
  ],
  "testResults": [
    {
      "name": "Test name (short)",
      "value": "value with unit",
      "normalRange": "normal range",
      "status": "normal",
      "meaning": "simple explanation of what this value means"
    }
  ],
  "normalValues": ["Test: value - normal hai, matlab..."],
  "abnormalValues": ["Test: value - high/low hai, matlab..."],
  "advice": "2-3 simple practical tips for this patient",
  "doctorQuestions": [
    "Question 1 to ask doctor",
    "Question 2 to ask doctor",
    "Question 3 to ask doctor"
  ],
  "disclaimer": "Yeh sirf samajhne ke liye hai. Doctor se milein."
}

Status must be exactly one of: "normal", "high", "low", "borderline"

If the uploaded text is NOT a medical report return:
{
  "summary": "Yeh medical report nahi lagti. Kripya apni blood report, MRI, ya koi medical document upload karein.",
  "keyFindings": [],
  "testResults": [],
  "normalValues": [],
  "abnormalValues": [],
  "advice": "",
  "doctorQuestions": [],
  "disclaimer": ""
}
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const cleaned = response.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed;
}

module.exports = { analyzeReport };
