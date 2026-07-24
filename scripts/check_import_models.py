#!/usr/bin/env python3
import ast
import importlib
import pathlib
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
IMPORT_MODELS_DIR = REPO_ROOT / "apps" / "renderer" / "import_models"
PACKAGE_ROOT = REPO_ROOT / "apps" / "renderer"


def fail(message):
    print(f"ERROR: {message}", file=sys.stderr)
    return 1


def module_imports_concrete_model(path, concrete_model_names):
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    imported = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            module = node.module or ""
            if node.level == 1 and module in concrete_model_names:
                imported.append(module)
            if module.startswith("apps.renderer.import_models."):
                imported_name = module.rsplit(".", 1)[-1]
                if imported_name in concrete_model_names:
                    imported.append(imported_name)
        elif isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name.startswith("apps.renderer.import_models."):
                    imported_name = alias.name.rsplit(".", 1)[-1]
                    if imported_name in concrete_model_names:
                        imported.append(imported_name)
    return sorted(set(imported))


def calls_validate_source_json(path):
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        function = node.func
        if isinstance(function, ast.Name) and function.id == "validate_source_json":
            return True
        if isinstance(function, ast.Attribute) and function.attr == "validate_source_json":
            return True
    return False


def main():
    sys.path.insert(0, str(PACKAGE_ROOT))
    registry = importlib.import_module("import_models.registry")
    rule_based = importlib.import_module("import_models.rule_based_credits")
    import_service = importlib.import_module("server_services.import_service")
    errors = []

    if not registry.IMPORT_MODELS:
        errors.append("registry.IMPORT_MODELS is empty")

    concrete_model_paths = [
        path
        for path in IMPORT_MODELS_DIR.glob("*.py")
        if path.name not in {"__init__.py", "registry.py"}
    ]
    concrete_model_names = {path.stem for path in concrete_model_paths}

    for model_id, model in registry.IMPORT_MODELS.items():
        if not isinstance(model, dict):
            errors.append(f"{model_id}: IMPORT_MODEL must be a dict")
            continue
        for key in ("id", "label", "source_kinds", "parse"):
            if key not in model:
                errors.append(f"{model_id}: missing IMPORT_MODEL['{key}']")
        if model.get("id") != model_id:
            errors.append(f"{model_id}: registry key does not match IMPORT_MODEL['id']")
        if not callable(model.get("parse")):
            errors.append(f"{model_id}: IMPORT_MODEL['parse'] must be callable")

    registered_modules = {
        getattr(model.get("parse"), "__module__", "").rsplit(".", 1)[-1]
        for model in registry.IMPORT_MODELS.values()
        if isinstance(model, dict)
    }
    unregistered = sorted(concrete_model_names - registered_modules)
    if unregistered:
        errors.append(f"unregistered import model modules: {', '.join(unregistered)}")

    for path in concrete_model_paths:
        imported = module_imports_concrete_model(path, concrete_model_names - {path.stem})
        if imported:
            errors.append(
                f"{path.relative_to(REPO_ROOT)} imports concrete model(s): {', '.join(imported)}"
            )
        if not calls_validate_source_json(path):
            errors.append(f"{path.relative_to(REPO_ROOT)} does not call validate_source_json")

    stale_source = {
        "source": "credits.ods",
        "import_rule_model": {"id": "rule_model_test", "revision": 2},
        "blocks": [{"group": "existing"}],
    }
    refreshed_source = {
        "source": "credits.ods",
        "import_rule_model": {"id": "rule_model_test", "revision": 3},
        "blocks": [{"group": "existing"}, {"group": "added"}],
    }
    refreshed, refresh_status = import_service.refresh_credit_source_if_stale(
        None,
        1,
        2,
        "rule_model_test",
        stale_source,
        {
            "get_rule_model": lambda _connection, _model_id: {"revision": 3},
            "load_source_file": lambda _connection, _production_id, _episode_id, _model_id: {
                "name": "credits.ods",
                "bytes": b"source",
            },
            "import_credit_source": lambda *_args: refreshed_source,
        },
    )
    if refreshed != refreshed_source or refresh_status != {
        "status": "refreshed",
        "from_revision": 2,
        "to_revision": 3,
        "added_block_groups": ["added"],
    }:
        errors.append("stale rule source was not refreshed to the current model revision")

    preserved, failure_status = import_service.refresh_credit_source_if_stale(
        None,
        1,
        2,
        "rule_model_test",
        stale_source,
        {
            "get_rule_model": lambda _connection, _model_id: {"revision": 3},
            "load_source_file": lambda *_args: None,
        },
    )
    if preserved != stale_source or not failure_status or failure_status.get("status") != "failed":
        errors.append("failed rule refresh did not preserve the last valid source")

    def boundary(name):
        return {
            "id": name.casefold().replace(" ", "_"),
            "name": name,
            "enabled": True,
            "header": {
                "source": "match",
                "column": "C",
                "operator": "equals",
                "value": name,
                "bold": "ignore",
                "merged_b_to_d": "ignore",
            },
        }

    definitions = [boundary("Primero"), boundary("Ausente"), boundary("Último")]
    rows = [
        {"row": 1, "values": {"C": "Primero"}, "bold": {}, "merged_b_to_d": False},
        {"row": 2, "values": {"C": "Contenido"}, "bold": {}, "merged_b_to_d": False},
        {"row": 3, "values": {"C": "Último"}, "bold": {}, "merged_b_to_d": False},
    ]
    instances = rule_based.find_block_instances(rows, definitions)
    matched_ids = [
        definition["id"]
        for definition, _instance in rule_based.matched_block_pairs(definitions, instances)
    ]
    if matched_ids != ["primero", "último"] or rule_based.blocking_instances(definitions, instances):
        errors.append("a missing rule boundary did not preserve the other matched boundaries")
    ambiguous_instances = rule_based.find_block_instances(
        rows + [{"row": 4, "values": {"C": "Primero"}, "bold": {}, "merged_b_to_d": False}],
        [boundary("Primero")],
    )
    if not rule_based.blocking_instances([boundary("Primero")], ambiguous_instances):
        errors.append("an ambiguous rule boundary did not remain blocking")

    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)

    if errors:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
