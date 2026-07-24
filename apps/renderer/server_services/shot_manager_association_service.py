from .common import now_iso


def _local_context(connection, production_id, episode_id):
    try:
        local_production_id = int(production_id)
        local_episode_id = int(episode_id)
    except (TypeError, ValueError) as error:
        raise ValueError(
            "La asociación necesita una producción y un capítulo válidos de Créditos."
        ) from error
    exists = connection.execute(
        """
        SELECT 1
        FROM episodes
        WHERE id = ? AND production_id = ?
        """,
        (local_episode_id, local_production_id),
    ).fetchone()
    if not exists:
        raise ValueError(
            "El capítulo seleccionado no pertenece a la producción de Créditos."
        )
    return local_production_id, local_episode_id


def _required_remote_id(value, label):
    normalized = str(value or "").strip()
    if not normalized:
        raise ValueError(f"La asociación necesita {label}.")
    return normalized


def _remote_episode_ids(season_id, episode_id):
    normalized_season_id = str(season_id).strip() if season_id is not None else None
    normalized_episode_id = str(episode_id).strip() if episode_id is not None else None
    if bool(normalized_season_id) != bool(normalized_episode_id):
        raise ValueError(
            "La temporada y el capítulo de Shot Manager deben indicarse juntos."
        )
    return normalized_season_id or None, normalized_episode_id or None


def _association_dict(row):
    if row is None:
        return None
    return {
        "creditosProductionId": str(row["production_id"]),
        "creditosEpisodeId": str(row["episode_id"]),
        "shotManagerProductionId": row["shot_manager_production_id"],
        "seasonId": row["shot_manager_season_id"],
        "episodeId": row["shot_manager_episode_id"],
        "structureEntryId": row["structure_entry_id"],
        "updatedAt": row["updated_at"],
    }


def load_shot_manager_association(connection, production_id, episode_id):
    local_production_id, local_episode_id = _local_context(
        connection, production_id, episode_id
    )
    row = connection.execute(
        """
        SELECT
            production_id,
            episode_id,
            shot_manager_production_id,
            shot_manager_season_id,
            shot_manager_episode_id,
            structure_entry_id,
            updated_at
        FROM shot_manager_associations
        WHERE production_id = ? AND episode_id = ?
        """,
        (local_production_id, local_episode_id),
    ).fetchone()
    return _association_dict(row)


def save_shot_manager_association(connection, payload):
    local_production_id, local_episode_id = _local_context(
        connection,
        payload.get("creditosProductionId"),
        payload.get("creditosEpisodeId"),
    )
    shot_manager_production_id = _required_remote_id(
        payload.get("shotManagerProductionId"),
        "la producción de Shot Manager",
    )
    structure_entry_id = _required_remote_id(
        payload.get("structureEntryId"),
        "el elemento de estructura de Shot Manager",
    )
    season_id, episode_id = _remote_episode_ids(
        payload.get("seasonId"),
        payload.get("episodeId"),
    )
    timestamp = now_iso()
    connection.execute(
        """
        INSERT INTO shot_manager_associations (
            production_id,
            episode_id,
            shot_manager_production_id,
            shot_manager_season_id,
            shot_manager_episode_id,
            structure_entry_id,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(production_id, episode_id) DO UPDATE SET
            shot_manager_production_id = excluded.shot_manager_production_id,
            shot_manager_season_id = excluded.shot_manager_season_id,
            shot_manager_episode_id = excluded.shot_manager_episode_id,
            structure_entry_id = excluded.structure_entry_id,
            updated_at = excluded.updated_at
        """,
        (
            local_production_id,
            local_episode_id,
            shot_manager_production_id,
            season_id,
            episode_id,
            structure_entry_id,
            timestamp,
        ),
    )
    connection.commit()
    return load_shot_manager_association(
        connection, local_production_id, local_episode_id
    )


def delete_shot_manager_association(connection, production_id, episode_id):
    local_production_id, local_episode_id = _local_context(
        connection, production_id, episode_id
    )
    cursor = connection.execute(
        """
        DELETE FROM shot_manager_associations
        WHERE production_id = ? AND episode_id = ?
        """,
        (local_production_id, local_episode_id),
    )
    connection.commit()
    return cursor.rowcount > 0
