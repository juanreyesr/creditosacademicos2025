from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import io
import pandas as pd
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    name: str
    role: str = "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[Dict[str, Any]] = None

class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    career_interest: str  # "psicologia_clinica" o "licenciatura_psicologicas"
    status: str = "nuevo"  # nuevo, contactado, en_proceso, inscrito
    source: str = "web"  # web, excel, manual
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    career_interest: str

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class Interaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: str
    interaction_type: str  # email, whatsapp, phone, visit
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InteractionCreate(BaseModel):
    lead_id: str
    interaction_type: str
    message: Optional[str] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # user, assistant
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

class GenerateMessageRequest(BaseModel):
    lead_id: str
    message_type: str  # email, whatsapp

class GenerateMessageResponse(BaseModel):
    subject: Optional[str] = None
    message: str
    whatsapp_link: Optional[str] = None

class Metrics(BaseModel):
    total_leads: int
    new_leads_7days: int
    contacted: int
    in_process: int
    enrolled: int
    by_career: Dict[str, int]
    by_status: Dict[str, int]

# ==================== CAREER DATA ====================

CAREER_DATA = {
    "psicologia_clinica": {
        "name": "Psicología Clínica y Consejería Social",
        "plan": "Plan Sábado",
        "duration": "5 años",
        "prices": {
            "inscription": "Q.500.00",
            "monthly": "Q.660.00",
            "card": "Q.100.00",
            "piaa": "Q.0.00 (Gratuito)"
        },
        "campus": "Campus Chimaltenango",
        "field": "Hospitales, clínicas privadas, instituciones educativas, programas de prevención, centros de rehabilitación, consultorios psicológicos, proyectos sociales, atención clínica, consejería social y programas de apoyo comunitario.",
        "description": "Carrera enfocada en la formación de profesionales capacitados para brindar atención psicológica clínica y consejería social en diversos contextos."
    },
    "licenciatura_psicologicas": {
        "name": "Licenciatura en Ciencias Psicológicas",
        "plan": "Plan Diario",
        "duration": "4 años",
        "prices": {
            "inscription": "Q.500.00",
            "monthly": "Q.570.00",
            "card": "Q.100.00",
            "piaa": "Q.0.00 (Gratuito)"
        },
        "campus": "Campus Chimaltenango",
        "field": "Investigación, docencia, consultoría organizacional, recursos humanos, desarrollo comunitario y atención psicológica general.",
        "description": "Carrera de 4 años en modalidad diaria que forma profesionales en ciencias psicológicas con enfoque integral."
    }
}

UPANA_INFO = """
Universidad Panamericana - Campus Chimaltenango

Características del Campus:
- Edificio propio
- Parque gratuito para estudiantes
- Seguridad 24 horas
- Laboratorios disponibles todo el tiempo

Contacto:
- Teléfono: 78394716
- WhatsApp del coordinador: 41850352
- Página de inscripciones: https://inscripciones.upana.edu.gt

Carreras Disponibles:

1. Psicología Clínica y Consejería Social (Plan Sábado - 5 años)
   - Inscripción: Q.500.00
   - Mensualidad: Q.660.00
   - Carné: Q.100.00
   - PIAA: Gratuito
   Campo Laboral: Hospitales, clínicas privadas, instituciones educativas, programas de prevención, centros de rehabilitación, consultorios psicológicos, proyectos sociales.

2. Licenciatura en Ciencias Psicológicas (Plan Diario - 4 años)
   - Inscripción: Q.500.00
   - Mensualidad: Q.570.00
   - Carné: Q.100.00
   - PIAA: Gratuito
   Campo Laboral: Investigación, docencia, consultoría organizacional, recursos humanos, desarrollo comunitario.

Proceso de Inscripción:
1. Realizar prueba PIAA (gratuita)
2. Presentar documentos requeridos
3. Inscripción en línea en https://inscripciones.upana.edu.gt
4. Pago de inscripción y primera mensualidad
5. Recibir carné estudiantil
"""

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    
    if not user:
        return LoginResponse(success=False, message="Usuario no encontrado")
    
    if not verify_password(request.password, user['password_hash']):
        return LoginResponse(success=False, message="Contraseña incorrecta")
    
    user_data = {"email": user['email'], "name": user['name'], "role": user['role']}
    return LoginResponse(success=True, message="Login exitoso", user=user_data)

@api_router.post("/auth/init-admin")
async def init_admin():
    existing = await db.users.find_one({"email": "juanr502@yahoo.es"})
    if existing:
        return {"message": "Admin ya existe"}
    
    admin = User(
        email="juanr502@yahoo.es",
        password_hash=hash_password("Juanjose5826"),
        name="Juan Rodríguez",
        role="admin"
    )
    
    doc = admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    return {"message": "Admin creado exitosamente", "email": admin.email}

# ==================== LEADS ENDPOINTS ====================

@api_router.post("/leads", response_model=Lead)
async def create_lead(lead: LeadCreate):
    new_lead = Lead(**lead.model_dump())
    doc = new_lead.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.leads.insert_one(doc)
    return new_lead

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(
    status: Optional[str] = None,
    career: Optional[str] = None,
    search: Optional[str] = None
):
    query = {}
    if status:
        query['status'] = status
    if career:
        query['career_interest'] = career
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'email': {'$regex': search, '$options': 'i'}},
            {'phone': {'$regex': search, '$options': 'i'}}
        ]
    
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for lead in leads:
        if isinstance(lead.get('created_at'), str):
            lead['created_at'] = datetime.fromisoformat(lead['created_at'])
        if isinstance(lead.get('updated_at'), str):
            lead['updated_at'] = datetime.fromisoformat(lead['updated_at'])
    
    return leads

@api_router.get("/leads/{lead_id}", response_model=Dict[str, Any])
async def get_lead_detail(lead_id: str):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    if isinstance(lead.get('created_at'), str):
        lead['created_at'] = datetime.fromisoformat(lead['created_at'])
    if isinstance(lead.get('updated_at'), str):
        lead['updated_at'] = datetime.fromisoformat(lead['updated_at'])
    
    interactions = await db.interactions.find({"lead_id": lead_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for interaction in interactions:
        if isinstance(interaction.get('created_at'), str):
            interaction['created_at'] = datetime.fromisoformat(interaction['created_at'])
    
    return {"lead": lead, "interactions": interactions}

@api_router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, update: LeadUpdate):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    
    updated_lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if isinstance(updated_lead.get('created_at'), str):
        updated_lead['created_at'] = datetime.fromisoformat(updated_lead['created_at'])
    if isinstance(updated_lead.get('updated_at'), str):
        updated_lead['updated_at'] = datetime.fromisoformat(updated_lead['updated_at'])
    
    return Lead(**updated_lead)

@api_router.post("/leads/import")
async def import_leads(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Formato de archivo no válido")
    
    contents = await file.read()
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        required_columns = ['name', 'email', 'phone', 'career_interest']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail=f"El archivo debe contener las columnas: {', '.join(required_columns)}")
        
        leads_created = 0
        for _, row in df.iterrows():
            lead = Lead(
                name=str(row['name']),
                email=str(row['email']),
                phone=str(row['phone']),
                career_interest=str(row['career_interest']),
                source="excel"
            )
            doc = lead.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            doc['updated_at'] = doc['updated_at'].isoformat()
            await db.leads.insert_one(doc)
            leads_created += 1
        
        return {"message": f"{leads_created} leads importados exitosamente"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar archivo: {str(e)}")

# ==================== INTERACTIONS ENDPOINTS ====================

@api_router.post("/interactions", response_model=Interaction)
async def create_interaction(interaction: InteractionCreate):
    new_interaction = Interaction(**interaction.model_dump())
    doc = new_interaction.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.interactions.insert_one(doc)
    return new_interaction

# ==================== CHAT AI ENDPOINTS ====================

@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Save user message
        user_msg = ChatMessage(
            session_id=request.session_id,
            role="user",
            content=request.message
        )
        user_doc = user_msg.model_dump()
        user_doc['created_at'] = user_doc['created_at'].isoformat()
        await db.chat_messages.insert_one(user_doc)
        
        # Get chat history
        history = await db.chat_messages.find(
            {"session_id": request.session_id},
            {"_id": 0}
        ).sort("created_at", 1).limit(10).to_list(10)
        
        # Initialize LLM chat
        system_message = f"""Eres un asistente virtual de la Universidad Panamericana, Campus Chimaltenango. 
        Tu rol es ayudar a estudiantes prospecto con información sobre las carreras de psicología.
        
        INFORMACIÓN IMPORTANTE:
        {UPANA_INFO}
        
        Instrucciones:
        - Sé amable, profesional y entusiasta
        - Proporciona información precisa y detallada
        - Si te preguntan algo que no está en la información, sugiere contactar directamente
        - Invita a los interesados a registrarse o contactar al coordinador
        - Responde en español de Guatemala
        """
        
        chat_instance = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=request.session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=request.message)
        response = await chat_instance.send_message(user_message)
        
        # Save assistant response
        assistant_msg = ChatMessage(
            session_id=request.session_id,
            role="assistant",
            content=response
        )
        assistant_doc = assistant_msg.model_dump()
        assistant_doc['created_at'] = assistant_doc['created_at'].isoformat()
        await db.chat_messages.insert_one(assistant_doc)
        
        return ChatResponse(response=response, session_id=request.session_id)
    
    except Exception as e:
        logging.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en el chat: {str(e)}")

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    messages = await db.chat_messages.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    for msg in messages:
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    
    return {"messages": messages}

# ==================== CAREERS ENDPOINTS ====================

@api_router.get("/careers")
async def get_careers():
    return {"careers": CAREER_DATA}

# ==================== GENERATE MESSAGE ENDPOINTS ====================

@api_router.post("/generate-message", response_model=GenerateMessageResponse)
async def generate_message(request: GenerateMessageRequest):
    lead = await db.leads.find_one({"id": request.lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    career = CAREER_DATA.get(lead['career_interest'])
    if not career:
        raise HTTPException(status_code=400, detail="Carrera no válida")
    
    if request.message_type == "email":
        subject = f"Información sobre {career['name']} - UPANA"
        message = f"""Estimado/a {lead['name']},

¡Gracias por tu interés en la {career['name']} en la Universidad Panamericana, Campus Chimaltenango!

Nos complace compartir contigo la siguiente información:

📚 Modalidad: {career['plan']}
⏱️ Duración: {career['duration']}
📍 Campus: {career['campus']}

💰 Costos:
- Inscripción: {career['prices']['inscription']}
- Mensualidad: {career['prices']['monthly']}
- Carné: {career['prices']['card']}
- PIAA: {career['prices']['piaa']}

🎯 Campo Laboral:
{career['field']}

✨ Beneficios del Campus Chimaltenango:
- Edificio propio
- Parque gratuito para estudiantes
- Seguridad 24 horas
- Laboratorios disponibles todo el tiempo

📞 Para más información:
- Teléfono: 78394716
- WhatsApp: 41850352
- Inscripciones: https://inscripciones.upana.edu.gt

¡Esperamos verte pronto en UPANA!

Saludos cordiales,
Coordinación de Psicología
Universidad Panamericana"""
        
        return GenerateMessageResponse(subject=subject, message=message)
    
    elif request.message_type == "whatsapp":
        message = f"""Hola {lead['name']}! 👋

Gracias por tu interés en {career['name']} 🎓

📌 *Información clave:*
• Modalidad: {career['plan']}
• Duración: {career['duration']}
• Inscripción: {career['prices']['inscription']}
• Mensualidad: {career['prices']['monthly']}

✨ Campus Chimaltenango: Edificio propio, seguridad 24/7, laboratorios disponibles

¿Te gustaría más información? Contáctame! 📱

🌐 Inscripciones: https://inscripciones.upana.edu.gt"""
        
        encoded_message = message.replace(' ', '%20').replace('\n', '%0A')
        whatsapp_link = f"https://wa.me/50241850352?text={encoded_message}"
        
        return GenerateMessageResponse(message=message, whatsapp_link=whatsapp_link)
    
    else:
        raise HTTPException(status_code=400, detail="Tipo de mensaje no válido")

# ==================== METRICS ENDPOINTS ====================

@api_router.get("/metrics", response_model=Metrics)
async def get_metrics():
    total_leads = await db.leads.count_documents({})
    
    seven_days_ago = datetime.now(timezone.utc) - pd.Timedelta(days=7)
    new_leads_7days = await db.leads.count_documents({
        "created_at": {"$gte": seven_days_ago.isoformat()}
    })
    
    contacted = await db.leads.count_documents({"status": "contactado"})
    in_process = await db.leads.count_documents({"status": "en_proceso"})
    enrolled = await db.leads.count_documents({"status": "inscrito"})
    
    by_career = {
        "psicologia_clinica": await db.leads.count_documents({"career_interest": "psicologia_clinica"}),
        "licenciatura_psicologicas": await db.leads.count_documents({"career_interest": "licenciatura_psicologicas"})
    }
    
    by_status = {
        "nuevo": await db.leads.count_documents({"status": "nuevo"}),
        "contactado": contacted,
        "en_proceso": in_process,
        "inscrito": enrolled
    }
    
    return Metrics(
        total_leads=total_leads,
        new_leads_7days=new_leads_7days,
        contacted=contacted,
        in_process=in_process,
        enrolled=enrolled,
        by_career=by_career,
        by_status=by_status
    )

# ==================== REPORTS ENDPOINTS ====================

@api_router.get("/reports/export")
async def export_report(
    format: str = Query("excel", regex="^(excel|csv)$"),
    status: Optional[str] = None,
    career: Optional[str] = None
):
    query = {}
    if status:
        query['status'] = status
    if career:
        query['career_interest'] = career
    
    leads = await db.leads.find(query, {"_id": 0}).to_list(10000)
    
    df = pd.DataFrame(leads)
    
    if format == "excel":
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Leads')
        output.seek(0)
        
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=leads_report.xlsx"}
        )
    
    elif format == "csv":
        output = BytesIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=leads_report.csv"}
        )

# ==================== INCLUDE ROUTER ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()