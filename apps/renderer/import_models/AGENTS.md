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
