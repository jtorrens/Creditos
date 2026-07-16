# Parser Lab Rules

This package owns the isolated parser inspection and model-development laboratory.

- Consume normalized spreadsheet reader output without modifying the readers or registered production models.
- Keep the inspection contract separate from production `source_json` and persisted editor documents.
- Candidate rules, traces, and comparisons must remain local to the parser lab.
- Do not import concrete production import models.
- Do not register experimental models in `import_models/registry.py` without explicit user authorization.
- Any integration with application navigation, HTTP routing, persistence, or shared state requires a separate explicitly authorized change.
