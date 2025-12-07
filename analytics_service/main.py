import os
import asyncpg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Flights Analytics Service",
    description="Сервис аналитики рейсов авиакомпании",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DSN для read-only пользователя аналитики
DB_DSN = os.getenv(
    "ANALYTICS_DB_DSN",
    "postgres://flights_analytics:analytics_password@localhost:5432/flights_db",
)


@app.on_event("startup")
async def startup():
    try:
        app.state.pool = await asyncpg.create_pool(DB_DSN)
        print("Analytics DB pool created")
    except Exception as e:
        print(f"Failed to create DB pool: {e}")
        raise


@app.on_event("shutdown")
async def shutdown():
    pool = getattr(app.state, "pool", None)
    if pool:
        await pool.close()
        print("Analytics DB pool closed")


@app.get("/analytics/status-summary")
async def status_summary():
    """
    Сводка по количеству рейсов в разрезе статусов.
    Пример ответа:
    [
      {"status": "scheduled", "count": 3},
      {"status": "boarding",  "count": 5}
    ]
    """
    pool = getattr(app.state, "pool", None)
    if pool is None:
        raise HTTPException(status_code=500, detail="DB pool is not initialized")

    query = """
        SELECT status, COUNT(*) AS cnt
        FROM flights
        GROUP BY status
        ORDER BY status;
    """

    async with pool.acquire() as conn:
        rows = await conn.fetch(query)

    return [
        {"status": r["status"], "count": r["cnt"]}
        for r in rows
    ]
