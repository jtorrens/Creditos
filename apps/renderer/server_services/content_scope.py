def content_scope(connection, production_id, episode_id):
    try:
        local_production_id = int(production_id)
    except (TypeError, ValueError) as error:
        raise ValueError("El contenido necesita una producción válida.") from error

    production = connection.execute(
        "SELECT production_type FROM productions WHERE id = ?",
        (local_production_id,),
    ).fetchone()
    if not production:
        raise ValueError("Producción no encontrada.")

    if production["production_type"] == "MOVIE":
        if episode_id not in (None, ""):
            raise ValueError("Una película no admite capítulo.")
        return local_production_id, None

    try:
        local_episode_id = int(episode_id)
    except (TypeError, ValueError) as error:
        raise ValueError("Una serie necesita un capítulo válido.") from error
    episode = connection.execute(
        """
        SELECT 1
        FROM episodes
        WHERE id = ? AND production_id = ?
        """,
        (local_episode_id, local_production_id),
    ).fetchone()
    if not episode:
        raise ValueError("El capítulo no pertenece a la producción.")
    return local_production_id, local_episode_id
