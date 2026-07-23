# Parser Lab Rules

This package owns the isolated parser inspection and model-development laboratory.

- Consume normalized spreadsheet reader output without modifying the readers or registered production models.
- Keep the inspection contract separate from production `source_json` and persisted editor documents.
- Candidate traces and comparisons remain local to Parser Lab. Saved models are persisted in `import_rule_models` and become selectable production import models only through the registered rule-based importer.
- Do not import concrete production import models.
- Do not register experimental models in `import_models/registry.py` without explicit user authorization.
- Parser Lab CRUD uses the active SQLite DB. Do not reintroduce the retired local JSON library as runtime persistence or fallback.
