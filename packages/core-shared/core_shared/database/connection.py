from tortoise import Tortoise


async def init_db(db_url: str, modules: dict[str, list[str]]) -> None:
    await Tortoise.init(db_url=db_url, modules=modules)
    await Tortoise.generate_schemas()


async def close_db() -> None:
    await Tortoise.close_connections()
