# Import Model Rules

To add a new import format:

1. Create `import_models/<model_id>.py`.
2. Expose `IMPORT_MODEL`.
3. Register it in `registry.py`.
4. Reuse common helpers from `import_models/common`.
5. Do not import another concrete import model.
6. Validate output with `validate_source_json` once the schema helper exists.
7. Add golden fixture tests.

Do not put parser rules in `server.py` or `app.js`.

## Parser Lab Isolation

- The parser lab may read normalized spreadsheet rows for inspection, but its candidate rules must not modify or be executed by registered production import models.
- Do not change an existing model's parse behavior, schema, or golden output for parser-lab work unless the user explicitly authorizes that production change.
- Keep inspection/trace data outside the stable production `source_json` contract and outside persisted editor documents.
- Any future promotion of a candidate model must be performed as a separate, explicitly authorized change with registry entry, schema validation, fixtures, and golden tests.

## Manual Rule Models

- `rule_based_credits` is the registered production family for DB-backed manual models.
- The selected rule record is loaded by the server service and passed explicitly to the parser.
- Production parsing must validate the current rule contract. Missing boundaries may be skipped when other enabled boundaries match; ambiguous or out-of-order boundaries must fail rather than guess. A model with no matching enabled boundary must also fail.
- Never read the retired Parser Lab JSON library from a production importer.
- Preserve the stable `source_json` boundary consumed by materials, structure, render, and Preview.
