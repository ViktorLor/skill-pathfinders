# Role-First Skill Collection Flow

## Goal

Improve onboarding so the user does not have to choose a track first. The app should first ask what kind of work the user does, capture the role name in the user's own words, then automatically map that role to one of the existing internal tracks.

The existing tracks stay behind the scenes:

- `tech`
- `trade`
- `agriculture`

The user-facing flow should feel like: "Tell us what you do. We will choose the right path."

## Main Flow

```text
Start onboarding
   ↓
Chat asks for role/work type
   ↓
Extract role name, work description, sector hints, tools, and tasks
   ↓
Classify into hidden track
   ↓
Route into one of the current 3 subflows
   ↓
Collect track-specific skill evidence
   ↓
Build structured skill profile
   ↓
Use profile for taxonomy mapping, AI risk lens, and opportunity matching
```

## First Chat Question

The first message should be open, simple, and role-first:

```text
What kind of work do you currently do, or what kind of work are you trying to move into?

Please write the name of the role if you know it, and describe what you usually do in a normal day.
```

Examples of good user answers:

```text
I repair phones and small electronics in a market stall.
```

```text
I want to become a junior software developer. I have built small websites and know some JavaScript.
```

```text
I grow maize and vegetables, and sometimes sell produce through a cooperative.
```

## Information To Extract From First Answer

The first answer should be converted into a small routing profile:

```json
{
  "role_name_raw": "",
  "role_description": "",
  "current_or_target": "current | target | both | unclear",
  "likely_sector": "",
  "main_tasks": [],
  "tools_or_inputs": [],
  "products_or_outputs": [],
  "confidence": "high | medium | low",
  "track_prediction": "tech | trade | agriculture | unclear",
  "clarifying_question": ""
}
```

## Track Selection Logic

### Tech Track

Choose `tech` when the answer mentions digital, software, data, IT, web, coding, analytics, cloud, cybersecurity, or online portfolio work.

Example signals:

- software developer
- data analyst
- web designer
- IT support
- cybersecurity
- GitHub, code, websites, apps
- SQL, Python, JavaScript, Excel analytics, dashboards

Then continue into the current tech-style flow:

```text
Role-first chat
   ↓
Tech detected
   ↓
Ask for CV, portfolio, GitHub, LinkedIn, or project examples
   ↓
Extract technical skills, tools, project evidence, and work goals
```

### Trade Track

Choose `trade` when the answer mentions practical service work, repair, making, selling, hospitality, beauty, mechanics, tailoring, carpentry, retail, or informal work experience.

Example signals:

- phone repair
- tailoring
- mechanic
- carpentry
- catering
- hair and beauty
- shop assistant
- general trading
- stock, customers, sales, repairs, tools

Then continue into the current trade-style flow:

```text
Role-first chat
   ↓
Trade detected
   ↓
Ask about typical day, complex tasks, customers, money/stock, training others
   ↓
Extract practical skills, business skills, customer skills, and evidence
```

### Agriculture Track

Choose `agriculture` when the answer mentions farming, crops, livestock, fishing, irrigation, land, harvest, cooperative, or agricultural selling.

Example signals:

- farmer
- maize, cassava, rice, vegetables, cocoa
- poultry, cattle, goats, fish farming
- planting, harvesting, irrigation
- pests, disease, fertilizer
- farm income, cooperative, market selling

Then continue into the current agriculture-style flow:

```text
Role-first chat
   ↓
Agriculture detected
   ↓
Ask about crops/livestock, land size, cooperative, pests, water, prices, records
   ↓
Extract farming skills, business skills, environmental skills, and evidence
```

## Ambiguous Role Handling

If the track prediction is low confidence, the chat should ask one clarifying question instead of forcing a route.

Example:

```text
When you say "business work", is most of your work about selling goods, managing a farm, or using digital/office tools?
```

The user can answer naturally. The system updates the routing profile and chooses the most likely track.

If the role could fit multiple tracks, keep the primary track and store secondary track hints.

Example:

```json
{
  "role_name_raw": "I sell farm produce online",
  "track_prediction": "agriculture",
  "secondary_track_hints": ["trade", "tech"]
}
```

## Improved Chatbox Behavior

The chatbox should do more than ask fixed questions. It should maintain a live structured profile while the user answers.

Recommended chat states:

```text
1. Role discovery
2. Track routing
3. Track-specific skill interview
4. Profile confirmation
5. Ready for taxonomy matching
```

The user should see a lightweight profile summary next to or below the chat:

```text
Role: Phone repairer
Track: Trade
Experience: 4 years
Skills found: diagnostics, customer service, stock management, small electronics repair
Needs clarification: formal training, business records
```

## Structured Skill Profile Output

After the subflow, the app should produce a richer profile that can later feed RAG and ISCO/ESCO matching:

```json
{
  "role": {
    "raw_name": "",
    "normalized_name": "",
    "current_or_target": "",
    "hidden_track": "tech | trade | agriculture"
  },
  "skills": {
    "technical": [],
    "tools": [],
    "domain": [],
    "business": [],
    "soft": []
  },
  "tasks": [],
  "experience": {
    "years": "",
    "education_level": "",
    "projects_or_work_examples": []
  },
  "context": {
    "country": "",
    "sector": "",
    "employment_type": ""
  },
  "evidence": [
    {
      "source_answer": "",
      "extracted_skills": [],
      "confidence": "high | medium | low"
    }
  ],
  "uncertainties": []
}
```

## Page Concept

The improved onboarding page can be structured as:

```text
Top: Stepper
   Step 1: Your role
   Step 2: Skill interview
   Step 3: Skill profile

Main area:
   Left: Chat interview
   Right: Live skill profile summary

After role detection:
   The page keeps the same user experience,
   but internally loads the right question set for tech, trade, or agriculture.
```

## Why This Works

This keeps the product user-friendly while preserving the current app architecture. Users describe their work naturally, the system maps that work into the existing three flows, and the later RAG/ISCO matching receives a clean structured profile instead of raw chat text.
