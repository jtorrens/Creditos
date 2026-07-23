from import_models.registry import DEFAULT_IMPORT_MODEL_ID, parse_source
from .import_rule_model_service import get_rule_model
from .source_file_service import load_source_file


def import_credit_source(connection, file_bytes, source_name, import_model_id=None, options=None):
    model_id = import_model_id or DEFAULT_IMPORT_MODEL_ID
    if str(model_id).startswith("rule_model_"):
        rule_model = get_rule_model(connection, model_id)
        return parse_source(
            file_bytes,
            source_name,
            "rule_based_credits",
            {**(options or {}), "rule_model": rule_model},
        )
    return parse_source(file_bytes, source_name, model_id, options)


def refresh_credit_source_if_stale(
    connection,
    production_id,
    episode_id,
    import_model_id,
    stored_source,
    dependencies=None,
):
    model_id = str(import_model_id or "")
    if not model_id.startswith("rule_model_"):
        return stored_source, None
    dependencies = dependencies or {}
    get_model = dependencies.get("get_rule_model", get_rule_model)
    load_file = dependencies.get("load_source_file", load_source_file)
    parse_credit_source = dependencies.get("import_credit_source", import_credit_source)
    try:
        current_model = get_model(connection, model_id)
        current_revision = int(current_model.get("revision") or 0)
        stored_model = stored_source.get("import_rule_model", {}) if isinstance(stored_source, dict) else {}
        stored_revision = int(stored_model.get("revision") or 0)
        if stored_revision == current_revision:
            return stored_source, None
        source_file = load_file(connection, production_id, episode_id, model_id)
        if stored_source is None and not source_file:
            return None, None
        if not source_file:
            raise ValueError("No existe un archivo asociado para reinterpretar este modelo.")
        refreshed = parse_credit_source(
            connection,
            source_file["bytes"],
            source_file["name"],
            model_id,
        )
        return refreshed, {
            "status": "refreshed",
            "from_revision": stored_revision,
            "to_revision": current_revision,
        }
    except Exception as error:
        return stored_source, {
            "status": "failed",
            "error": str(error),
        }
