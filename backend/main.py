from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.api.endpoints import auth, categories, payment_methods, transactions, analytics, budgets


# 初期化時にテーブルを作成
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown


app = FastAPI(
    title="FluxusLedger API",
    description="Next-generation household accounting application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターの登録
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(payment_methods.router)
app.include_router(transactions.router)
app.include_router(analytics.router)
app.include_router(budgets.router)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "FluxusLedger API",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
