from .common import now_iso


def _local_production(connection, production_id):
    try:
        local_production_id = int(production_id)
    except (TypeError, ValueError) as error:
        raise ValueError("La asociación necesita una producción válida de Créditos.") from error
    exists = connection.execute(
        "SELECT 1 FROM productions WHERE id = ?",
        (local_production_id,),
    ).fetchone()
    if not exists:
        raise ValueError("La producción de Créditos no existe.")
    return local_production_id


def _required_remote_id(value, label):
    normalized = str(value or "").strip()
    if not normalized:
        raise ValueError(f"La asociación necesita {label}.")
    return normalized


def _association_dict(row):
    if row is None:
        return None
    return {
        "creditosProductionId": str(row["production_id"]),
        "shotManagerProductionId": row["shot_manager_production_id"],
        "structureEntryId": row["structure_entry_id"],
        "updatedAt": row["updated_at"],
    }


def load_shot_manager_association(connection, production_id):
    local_production_id = _local_production(connection, production_id)
    row = connection.execute(
        """
        SELECT
            production_id,
            shot_manager_production_id,
            structure_entry_id,
            updated_at
        FROM shot_manager_associations
        WHERE production_id = ?
        """,
        (local_production_id,),
    ).fetchone()
    return _association_dict(row)


def save_shot_manager_association(connection, payload):
    local_production_id = _local_production(
        connection,
        payload.get("creditosProductionId"),
    )
    shot_manager_production_id = _required_remote_id(
        payload.get("shotManagerProductionId"),
        "la producción de Shot Manager",
    )
    structure_entry_id = _required_remote_id(
        payload.get("structureEntryId"),
        "el elemento de estructura de Shot Manager",
    )
    timestamp = now_iso()
    connection.execute(
        """
        INSERT INTO shot_manager_associations (
            production_id,
            shot_manager_production_id,
            structure_entry_id,
            updated_at
        )
        VALUES (?, ?, ?, ?)
        ON CONFLICT(production_id) DO UPDATE SET
            shot_manager_production_id = excluded.shot_manager_production_id,
            structure_entry_id = excluded.structure_entry_id,
            updated_at = excluded.updated_at
        """,
        (
            local_production_id,
            shot_manager_production_id,
            structure_entry_id,
            timestamp,
        ),
    )
    connection.commit()
    return load_shot_manager_association(connection, local_production_id)


def delete_shot_manager_association(connection, production_id):
    local_production_id = _local_production(connection, production_id)
    cursor = connection.execute(
        "DELETE FROM shot_manager_associations WHERE production_id = ?",
        (local_production_id,),
    )
    connection.commit()
    return cursor.rowcount > 0
