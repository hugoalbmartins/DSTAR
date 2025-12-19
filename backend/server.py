from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'leiritrix-crm-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="CRM Leiritrix API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    BACKOFFICE = "backoffice"
    VENDEDOR = "vendedor"

class SaleStatus(str, Enum):
    EM_NEGOCIACAO = "em_negociacao"
    PERDIDO = "perdido"
    PENDENTE = "pendente"
    ATIVO = "ativo"
    ANULADO = "anulado"

class SaleCategory(str, Enum):
    ENERGIA = "energia"
    TELECOMUNICACOES = "telecomunicacoes"
    PAINEIS_SOLARES = "paineis_solares"

class SaleType(str, Enum):
    NOVA_INSTALACAO = "nova_instalacao"
    REFID = "refid"

# Models
class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    name: str
    role: UserRole = UserRole.VENDEDOR

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    active: bool = True

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    active: bool

class SaleBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    client_name: str
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    client_nif: Optional[str] = None
    category: SaleCategory
    sale_type: Optional[SaleType] = None
    partner: str
    contract_value: float = 0
    loyalty_months: int = 0
    notes: Optional[str] = None

class SaleCreate(SaleBase):
    pass

class SaleUpdate(BaseModel):
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    client_nif: Optional[str] = None
    category: Optional[SaleCategory] = None
    sale_type: Optional[SaleType] = None
    partner: Optional[str] = None
    contract_value: Optional[float] = None
    loyalty_months: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[SaleStatus] = None

class Sale(SaleBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: SaleStatus = SaleStatus.EM_NEGOCIACAO
    seller_id: str
    seller_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    active_date: Optional[datetime] = None
    loyalty_end_date: Optional[datetime] = None
    commission: Optional[float] = None
    commission_assigned_by: Optional[str] = None
    commission_assigned_at: Optional[datetime] = None

class CommissionAssign(BaseModel):
    commission: float

class ReportFilter(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    category: Optional[SaleCategory] = None
    status: Optional[SaleStatus] = None
    seller_id: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Utilizador não encontrado")
    return user

async def require_admin_or_backoffice(user: dict = Depends(get_current_user)):
    if user["role"] not in [UserRole.ADMIN, UserRole.BACKOFFICE]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    return user

async def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas administradores")
    return user

# Auth endpoints
@api_router.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, current_user: dict = Depends(require_admin)):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    
    user = User(**user_data.model_dump(exclude={"password"}))
    user_dict = user.model_dump()
    user_dict["password_hash"] = hash_password(user_data.password)
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    return UserResponse(**user_dict)

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    if not user.get("active", True):
        raise HTTPException(status_code=401, detail="Conta desativada")
    
    token = create_token(user["id"], user["email"], user["role"])
    return {
        "token": token,
        "user": UserResponse(**user)
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

# Users endpoints
@api_router.get("/users", response_model=List[UserResponse])
async def list_users(current_user: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: str, current_user: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    new_status = not user.get("active", True)
    await db.users.update_one({"id": user_id}, {"$set": {"active": new_status}})
    return {"message": "Status atualizado", "active": new_status}

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: UserRole, current_user: dict = Depends(require_admin)):
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    return {"message": "Role atualizado"}

# Sales endpoints
@api_router.post("/sales", response_model=dict)
async def create_sale(sale_data: SaleCreate, current_user: dict = Depends(get_current_user)):
    sale = Sale(
        **sale_data.model_dump(),
        seller_id=current_user["id"],
        seller_name=current_user["name"]
    )
    sale_dict = sale.model_dump()
    sale_dict["created_at"] = sale_dict["created_at"].isoformat()
    sale_dict["updated_at"] = sale_dict["updated_at"].isoformat()
    
    await db.sales.insert_one(sale_dict)
    # Remove MongoDB _id before returning
    sale_dict.pop("_id", None)
    return sale_dict

@api_router.get("/sales")
async def list_sales(
    status: Optional[SaleStatus] = None,
    category: Optional[SaleCategory] = None,
    seller_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    # Vendedores só veem suas próprias vendas
    if current_user["role"] == UserRole.VENDEDOR:
        query["seller_id"] = current_user["id"]
    elif seller_id:
        query["seller_id"] = seller_id
    
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"client_name": {"$regex": search, "$options": "i"}},
            {"client_nif": {"$regex": search, "$options": "i"}},
            {"partner": {"$regex": search, "$options": "i"}}
        ]
    
    sales = await db.sales.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return sales

@api_router.get("/sales/{sale_id}")
async def get_sale(sale_id: str, current_user: dict = Depends(get_current_user)):
    sale = await db.sales.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    
    # Vendedores só veem suas próprias vendas
    if current_user["role"] == UserRole.VENDEDOR and sale["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    return sale

@api_router.put("/sales/{sale_id}")
async def update_sale(sale_id: str, update_data: SaleUpdate, current_user: dict = Depends(get_current_user)):
    sale = await db.sales.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    
    # Vendedores só editam suas próprias vendas
    if current_user["role"] == UserRole.VENDEDOR and sale["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Se o status mudar para ATIVO, definir a data de ativação e calcular fim de fidelização
    if update_data.status == SaleStatus.ATIVO and sale.get("status") != SaleStatus.ATIVO:
        active_date = datetime.now(timezone.utc)
        update_dict["active_date"] = active_date.isoformat()
        
        loyalty_months = sale.get("loyalty_months", 0)
        if loyalty_months > 0:
            loyalty_end = active_date + timedelta(days=loyalty_months * 30)
            update_dict["loyalty_end_date"] = loyalty_end.isoformat()
    
    await db.sales.update_one({"id": sale_id}, {"$set": update_dict})
    
    updated_sale = await db.sales.find_one({"id": sale_id}, {"_id": 0})
    return updated_sale

@api_router.delete("/sales/{sale_id}")
async def delete_sale(sale_id: str, current_user: dict = Depends(require_admin_or_backoffice)):
    result = await db.sales.delete_one({"id": sale_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return {"message": "Venda eliminada"}

# Commission endpoints
@api_router.put("/sales/{sale_id}/commission")
async def assign_commission(
    sale_id: str, 
    commission_data: CommissionAssign, 
    current_user: dict = Depends(require_admin_or_backoffice)
):
    sale = await db.sales.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    
    update_dict = {
        "commission": commission_data.commission,
        "commission_assigned_by": current_user["name"],
        "commission_assigned_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.sales.update_one({"id": sale_id}, {"$set": update_dict})
    
    updated_sale = await db.sales.find_one({"id": sale_id}, {"_id": 0})
    return updated_sale

# Dashboard / Metrics endpoints
@api_router.get("/dashboard/metrics")
async def get_dashboard_metrics(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["role"] == UserRole.VENDEDOR:
        query["seller_id"] = current_user["id"]
    
    # Total de vendas
    total_sales = await db.sales.count_documents(query)
    
    # Vendas por status
    pipeline = [
        {"$match": query},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = await db.sales.aggregate(pipeline).to_list(100)
    status_dict = {s["_id"]: s["count"] for s in status_counts}
    
    # Vendas por categoria
    pipeline_cat = [
        {"$match": query},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    category_counts = await db.sales.aggregate(pipeline_cat).to_list(100)
    category_dict = {c["_id"]: c["count"] for c in category_counts}
    
    # Valor total de contratos ativos
    active_query = {**query, "status": SaleStatus.ATIVO}
    pipeline_value = [
        {"$match": active_query},
        {"$group": {"_id": None, "total": {"$sum": "$contract_value"}}}
    ]
    value_result = await db.sales.aggregate(pipeline_value).to_list(1)
    total_value = value_result[0]["total"] if value_result else 0
    
    # Total de comissões
    pipeline_commission = [
        {"$match": {**query, "commission": {"$ne": None}}},
        {"$group": {"_id": None, "total": {"$sum": "$commission"}}}
    ]
    commission_result = await db.sales.aggregate(pipeline_commission).to_list(1)
    total_commission = commission_result[0]["total"] if commission_result else 0
    
    # Vendas este mês
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_query = {**query, "created_at": {"$gte": start_of_month.isoformat()}}
    sales_this_month = await db.sales.count_documents(month_query)
    
    return {
        "total_sales": total_sales,
        "sales_by_status": status_dict,
        "sales_by_category": category_dict,
        "total_contract_value": total_value,
        "total_commission": total_commission,
        "sales_this_month": sales_this_month
    }

@api_router.get("/dashboard/monthly-stats")
async def get_monthly_stats(months: int = 6, current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["role"] == UserRole.VENDEDOR:
        query["seller_id"] = current_user["id"]
    
    now = datetime.now(timezone.utc)
    stats = []
    
    for i in range(months - 1, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1)
        
        month_query = {
            **query,
            "created_at": {
                "$gte": month_start.isoformat(),
                "$lt": month_end.isoformat()
            }
        }
        
        count = await db.sales.count_documents(month_query)
        
        pipeline = [
            {"$match": {**month_query, "status": SaleStatus.ATIVO}},
            {"$group": {"_id": None, "total": {"$sum": "$contract_value"}}}
        ]
        value_result = await db.sales.aggregate(pipeline).to_list(1)
        value = value_result[0]["total"] if value_result else 0
        
        stats.append({
            "month": month_start.strftime("%b %Y"),
            "sales": count,
            "value": value
        })
    
    return stats

# Loyalty Alerts endpoint
@api_router.get("/alerts/loyalty")
async def get_loyalty_alerts(current_user: dict = Depends(get_current_user)):
    # Encontrar contratos ativos onde faltam <= 7 meses para o fim da fidelização
    now = datetime.now(timezone.utc)
    alert_threshold = now + timedelta(days=7 * 30)  # 7 meses
    
    query = {
        "status": SaleStatus.ATIVO,
        "loyalty_end_date": {"$ne": None, "$lte": alert_threshold.isoformat()}
    }
    
    if current_user["role"] == UserRole.VENDEDOR:
        query["seller_id"] = current_user["id"]
    
    alerts = await db.sales.find(query, {"_id": 0}).sort("loyalty_end_date", 1).to_list(100)
    
    # Calcular dias restantes
    for alert in alerts:
        if alert.get("loyalty_end_date"):
            end_date = datetime.fromisoformat(alert["loyalty_end_date"].replace("Z", "+00:00"))
            days_left = (end_date - now).days
            alert["days_until_end"] = max(0, days_left)
    
    return alerts

# Reports endpoint
@api_router.get("/reports/sales")
async def generate_sales_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[SaleCategory] = None,
    status: Optional[SaleStatus] = None,
    seller_id: Optional[str] = None,
    current_user: dict = Depends(require_admin_or_backoffice)
):
    query = {}
    
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    if seller_id:
        query["seller_id"] = seller_id
    
    sales = await db.sales.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
    
    # Calcular totais
    total_value = sum(s.get("contract_value", 0) for s in sales)
    total_commission = sum(s.get("commission", 0) or 0 for s in sales)
    
    return {
        "sales": sales,
        "summary": {
            "total_count": len(sales),
            "total_value": total_value,
            "total_commission": total_commission
        }
    }

# Initialize default admin user
@api_router.post("/init")
async def init_system():
    # Check if admin exists
    admin = await db.users.find_one({"role": UserRole.ADMIN})
    if admin:
        return {"message": "Sistema já inicializado"}
    
    # Create default admin
    admin_user = User(
        email="admin@leiritrix.pt",
        name="Administrador",
        role=UserRole.ADMIN
    )
    admin_dict = admin_user.model_dump()
    admin_dict["password_hash"] = hash_password("admin123")
    admin_dict["created_at"] = admin_dict["created_at"].isoformat()
    
    await db.users.insert_one(admin_dict)
    
    return {
        "message": "Sistema inicializado",
        "admin_email": "admin@leiritrix.pt",
        "admin_password": "admin123"
    }

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "CRM Leiritrix API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
