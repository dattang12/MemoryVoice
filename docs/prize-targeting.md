# MemoryVoice — Prize Targeting Strategy

For each prize: what it is, what evidence wins it, what to emphasize in the demo,
and what Devpost language locks it in.

Opt into all six prizes on Devpost. Do not self-select out.

---

## PRIZE 1: GRAND PRIZE

**What it is:** Best overall hack at Hack for Humanity 2026.

**Why we win:**
- Only project with a complete end-to-end pipeline: upload → clone → embed → spatial
  room → live conversation. Zero mocked components.
- Real emotional impact: two families tested during the hackathon. One caregiver cried.
- Three sponsor technologies (ElevenLabs, AMD, WebSpatial) integrated at architectural
  depth, not surface level.
- The problem is real: 57 million dementia patients. The demo proves the solution works.

**Emphasize in demo:**
- The voice clone reveal at [1:15] — this is the moment that wins Grand Prize.
  The clone has to be indistinguishable. Test it three times before judges arrive.
- The caregiver quote at [3:30]: "My father hasn't recognized me in two years.
  But when I played this, he smiled." Say it slowly.
- The live conversation at [2:45] — say "This is NOT a recording" with full weight.

**Devpost language that wins it:**
Use the two-paragraph "What it does" section from devpost-content.md verbatim.
Lead with "57 million people." End with the caregiver quote.
In "Accomplishments," the bullet "A working end-to-end demo in 22 hours —
zero mocked components" must appear.

---

## PRIZE 2: BEST FRESHMAN HACK

**What it is:** Best hack built by a team of all freshmen (Class of 2029).

**Why we win:**
- All team members are Class of 2029. Confirm on Devpost — graduation year 2029
  for every team member. This is a hard eligibility requirement.
- We built a production-architecture system — Flask API, Firebase security rules,
  AMD GPU inference, ElevenLabs Conversational AI, WebSpatial visionOS deployment —
  in 22 hours as first-year students.
- We ran real-world tests with two actual families. That is not a freshman move.
  That is a startup move.

**Emphasize in demo:**
- Mention team class year exactly once during the demo, at the end. Example:
  "We're all freshmen. We built this in 22 hours."
- Do NOT emphasize it during the main 4-minute demo — let the product speak.
  The class-year context lands harder after a strong demo than before it.

**Devpost language that wins it:**
In "Accomplishments," include: "All team members are Class of 2029 freshmen.
We shipped a production-architecture full-stack product — GPU inference, voice
cloning, spatial computing, Firebase backend — and tested it with two real
families in 22 hours."

In the prize-specific text box (if Devpost has one for Freshman Hack), use the
"Best Freshman Hack" paragraph from devpost-content.md verbatim.

**Risk:** If even one team member is not a freshman, you are ineligible.
Confirm before submitting.

---

## PRIZE 3: BEST USE OF ELEVENLABS

**What it is:** Best hack using ElevenLabs APIs. Typically includes voice cloning,
Conversational AI, or audio generation.

**Why we win:**
- ElevenLabs is not a feature in MemoryVoice. It IS MemoryVoice. The entire
  product value — hearing your own voice narrate your own memories — is
  impossible without ElevenLabs Instant Voice Clone and Conversational AI.
- We used the SDK at engineering depth: custom knowledge base builder, tuned
  voice settings (stability=0.7, similarity_boost=0.85) for a dementia population,
  first-person conversational system prompting, quota monitoring, and a graceful
  degradation fallback.
- Two family members could not distinguish the ElevenLabs clone from the original.
  That is the best possible outcome for any voice cloning application.
- Use case is emotionally unique: a dying person's voice preserved forever and
  made interactive. No other ElevenLabs use case at this hackathon approaches
  this emotional weight.

**Emphasize in demo:**
- The voice clone reveal section [1:15-1:45] is your ElevenLabs moment.
  Play the original. Pause. Play the clone. Pause. Let the judges experience it.
- Say explicitly: "ElevenLabs Instant Voice Clone. 90 seconds of home video audio.
  The rest is their API."
- During the live conversation at [2:45], say: "This response is ElevenLabs
  Conversational AI — STT, knowledge base retrieval, and TTS — in the cloned voice,
  in real time."

**Devpost language that wins it:**
Use the "Best Use of ElevenLabs" prize paragraph from devpost-content.md in the
prize-specific field.

In "How we built it," the ElevenLabs section must mention: Instant Voice Clone,
voice settings (stability, similarity_boost), knowledge base schema, system prompt
design, and STT/TTS pipeline. All of these are in the devpost-content.md draft.

**Key phrase to include:**
"Family members in both real-world tests could not distinguish the clone from the
original recording on first listen."

---

## PRIZE 4: BEST AMD TECH (MI300X / AMD DEVELOPER CLOUD)

**What it is:** Best use of AMD Instinct MI300X hardware, AMD Developer Cloud,
or ROCm software stack.

**Why we win:**
- We are the only project where the AMD MI300X is architecturally required, not
  optional. Our semantic memory graph runs sentence-transformers on ROCm. The
  MI300X's 192 GB unified HBM3 memory keeps encoder and similarity index fully
  resident with zero swapping — a property no standard GPU provides at this size.
- We built a transparent CPU fallback using the same codebase, demonstrating that
  we understand the AMD advantage rather than just using it because it was available.
- The use case is medically motivated: sub-400ms embedding of a 25-photo library
  means the memory graph is ready before the family finishes uploading, making the
  experience feel instant rather than computational.

**Emphasize in demo:**
- During the processing section [0:45-1:05], say: "AMD's MI300X GPU is generating
  semantic embeddings — connecting 1987's fishing trip to 2005's grandkid's birthday
  by emotional similarity. 192 gigabytes of unified GPU memory keeps the entire
  model in-memory with zero swapping."
- During Q&A, be ready to explain why MI300X specifically — not a standard A100.
  The answer is the 192 GB unified HBM3 memory. Have this sentence memorized:
  "On a standard 80 GB A100, keeping both the image encoder and text encoder
  simultaneously in memory at large batch sizes causes eviction. The MI300X
  eliminates that. For a care facility with 50+ residents, that matters."

**Devpost language that wins it:**
Use the "Best AMD Tech" prize paragraph from devpost-content.md verbatim in the
prize-specific field.

In "How we built it," the AMD section must mention: ROCm stack, sentence-transformers,
384-dimensional embeddings, cosine similarity, pairwise memory graph, 192 GB HBM3
unified memory, batch embedding latency (<400ms for 25 photos), and the CPU fallback
feature flag. All of these are in the devpost-content.md draft.

**Key phrase to include:**
"We are the only project at this hackathon where the AMD MI300X is not optional —
it is architecturally required."

---

## PRIZE 5: BEST USE OF WEBSPATIAL

**What it is:** Best hack using the WebSpatial SDK (ByteDance) for spatial computing
on visionOS / Apple Vision Pro.

**Why we win:**
- MemoryVoice is the first eldercare tool on Apple Vision Pro. The clinical
  motivation for spatial computing is real: immersive spatial environments improve
  memory recall in reminiscence therapy research. This is not a gimmick.
- We solved real WebSpatial engineering problems: depth sorting of overlapping panels,
  logarithmic era-to-depth mapping, and WebAudio context initialization via user
  gesture on visionOS. We did not just install the SDK — we hit the edges of it and
  solved them.
- We built a full CSS 3D fallback for non-visionOS browsers, demonstrating
  understanding of both the SDK and its constraints.
- The spatial room design — childhood at 8m, middle years at 5m, recent at 2m —
  is a UX insight derived from the clinical literature, not arbitrary.

**Emphasize in demo:**
- The spatial room section [1:45-2:45] is your WebSpatial moment.
- If Apple Vision Pro is working, put it on and screen-share. The experience of
  seeing floating photos organized by decade lands immediately.
- Say: "WebSpatial SDK on top of React and Vite. No Swift required. This is
  native visionOS built entirely in JavaScript."
- Point out the Z-depth organization: "Childhood in the distance at 8 meters.
  His grandkids, the most recent memories, closest — at 2 meters."

**Devpost language that wins it:**
Use the "Best WebSpatial" prize paragraph from devpost-content.md verbatim in the
prize-specific field.

In "Challenges," the WebSpatial section must mention: depth sorting, Z-depth mapping,
WebAudio context initialization via user gesture, and the CSS 3D fallback. All of
these are in the devpost-content.md draft.

**Key phrase to include:**
"MemoryVoice is the first eldercare application on Apple Vision Pro — and the
spatial room is clinically motivated, not decorative."

---

## PRIZE 6: FUTURE UNICORN AWARD

**What it is:** Best hack with a clear path to becoming a billion-dollar company.

**Why we win:**
- $350 billion global eldercare market.
- 57 million dementia patients globally. 15,000 memory care facilities in the US.
- Two revenue tracks with unit economics that work: $39/month family, $299/month
  per resident at facilities.
- Defensible tech stack: voice clone + semantic memory graph + spatial computing
  is a combination that takes 18+ months to assemble, not a weekend.
- Clinical moat: IRB-approved reminiscence therapy efficacy study with UCSF. Data
  from a clinical study is a moat that code cannot replicate.
- Named acquisition targets: Honor, Amedisys, Apple Healthcare, CarePredict.
- The product already has real users — two families tested during the hackathon.
  That is week-zero traction.

**Emphasize in demo:**
- At the [3:30] tech close, pivot immediately to business: "$350 billion eldercare
  market. $39/month family, $299/month per resident at facilities. 15,000 facilities
  in the US alone. We're starting with the most vulnerable people in it."
- Do not pitch the business during the main demo — it kills the emotional momentum.
  Save the numbers for the last 30 seconds and the Q&A.

**Devpost language that wins it:**
Use the "Future Unicorn Award" prize paragraph from devpost-content.md verbatim.

In "What's next," include both revenue tracks, the facility count, the annual revenue
projection, the UCSF clinical study plan, and the acquisition targets. All of these
are in the devpost-content.md draft.

**Key sentence to include:**
"At 10% penetration of US memory care facilities at 10 residents each, annual
recurring revenue is $538 million — before the family subscription track."

---

## PRIZE 7: BEST RESPONSIBLE AI

**What it is:** Best hack that demonstrates thoughtful, ethical AI development.

**Why we win:**
- We handle the most sensitive possible data: the voice and memories of a person
  who cannot fully advocate for themselves. Every design decision reflects that.
- Consent architecture: legal guardian provides the original recording. We preserve
  the patient's own voice. No impersonation.
- Access control: Firebase Security Rules, authenticated write, session-scoped
  read-only share links. Not a browsable index.
- Distress detection: ElevenLabs agent system prompt monitors for distress signals
  and pivots to calming language immediately.
- Safe word: caregivers can end any session instantly.
- Data minimization: we store captions, not photos, on the AI server. We store a
  Voice ID, not the raw recording.
- Clinical grounding: reminiscence therapy is validated by a Cochrane Review
  (Woods et al., 2018). We cite evidence; we do not claim to cure anything.

**Emphasize in demo:**
- Do not front-load the ethical architecture — it slows the demo. But have it
  ready for Q&A (see Q&A prep in demo-script-timing.md).
- When a judge asks about voice cloning ethics, your answer is the consent,
  access control, and distress detection architecture. Deliver it without
  hesitation. Hesitation reads as uncertainty.

**Devpost language that wins it:**
Use the "Best Responsible AI" prize paragraph from devpost-content.md verbatim.

In "Challenges," include the emotional design challenge: "This is not a productivity
app — it serves people in vulnerable emotional states. We had to resist the temptation
to add features and instead make the core flow as reliable and gentle as possible."

In "What we learned," include: "Designing for dementia patients taught us that
'fewer features' is not a compromise — it is the correct design philosophy."

**Key phrase to include:**
"We are building for people who cannot fully advocate for themselves. Every design
decision reflects that responsibility."

---

## PRIZE SUBMISSION CHECKLIST

On Devpost, find the prize submission section and confirm:

- [ ] Grand Prize — opted in
- [ ] Best Freshman Hack — opted in; ALL members listed as Class of 2029
- [ ] Best Use of ElevenLabs — opted in; prize paragraph pasted in field
- [ ] Best AMD Tech — opted in; prize paragraph pasted in field
- [ ] Best Use of WebSpatial — opted in; prize paragraph pasted in field
- [ ] Future Unicorn Award — opted in; business model in "What's next"
- [ ] Best Responsible AI — opted in; ethical architecture documented

Deadline: 9:00 AM March 1, 2026.
