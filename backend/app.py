import os
import time
import json
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

import jwt
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "https://seu-usuario.github.io")
ENV = os.environ.get("ENV", "development")
TOKEN_EXPIRY_SECONDS = 30
RATE_LIMIT = 10

CF_IP_RANGES = [
    "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
    "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
    "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
    "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("luciana-backend")

def ip_in_range(ip: str, cidr: str) -> bool:
    import ipaddress
    return ipaddress.ip_address(ip) in ipaddress.ip_network(cidr)

def is_cloudflare_ip(ip: str) -> bool:
    return any(ip_in_range(ip, cidr) for cidr in CF_IP_RANGES)

def rate_limiter(ip: str):
    now = time.time()
    if ip not in rate_limiter.store:
        rate_limiter.store[ip] = []
    rate_limiter.store[ip] = [t for t in rate_limiter.store[ip] if now - t < 60]
    if len(rate_limiter.store[ip]) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Muitas requisições")
    rate_limiter.store[ip].append(now)
rate_limiter.store = {}

app = FastAPI(title="Luciana Lima Auth")

if ENV == "production":
    origins = [ALLOWED_ORIGIN]
else:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

class TokenRequest(BaseModel):
    session_id: str
    fingerprint: Dict[str, Any]

class TokenResponse(BaseModel):
    token: str
    expires_at: int

@app.post("/token", response_model=TokenResponse)
async def generate_token(req: Request, payload: TokenRequest):
    client_ip = req.headers.get("CF-Connecting-IP") or req.client.host
    logger.info(f"Token request from {client_ip}")

    if ENV == "production":
        if not is_cloudflare_ip(req.client.host):
            raise HTTPException(status_code=403, detail="Acesso direto não permitido")

    rate_limiter(client_ip)

    now = datetime.now(timezone.utc)
    exp = now + timedelta(seconds=TOKEN_EXPIRY_SECONDS)
    claims = {
        "sub": payload.session_id,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "fingerprint_hash": hashlib.sha256(json.dumps(payload.fingerprint, sort_keys=True).encode()).hexdigest(),
        "ip": client_ip,
        "aud": "lucianalima-links",
        "iss": "lucianalima-backend",
    }
    token = jwt.encode(claims, SECRET_KEY, algorithm="HS256")
    return TokenResponse(token=token, expires_at=int(exp.timestamp()))

@app.post("/verify")
async def verify_token(req: Request):
    auth = req.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401)
    token = auth.split(" ")[1]
    try:
        claims = jwt.decode(token, SECRET_KEY, algorithms=["HS256"], audience="lucianalima-links")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    return {"valid": True, "exp": claims["exp"]}

@app.post("/refresh")
async def refresh_token(req: Request):
    auth = req.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401)
    token = auth.split(" ")[1]
    try:
        claims = jwt.decode(token, SECRET_KEY, algorithms=["HS256"], audience="lucianalima-links")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

    now = datetime.now(timezone.utc)
    exp = now + timedelta(seconds=TOKEN_EXPIRY_SECONDS)
    new_claims = {
        "sub": claims["sub"],
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "fingerprint_hash": claims.get("fingerprint_hash"),
        "ip": claims["ip"],
        "aud": "lucianalima-links",
        "iss": "lucianalima-backend",
    }
    new_token = jwt.encode(new_claims, SECRET_KEY, algorithm="HS256")
    return TokenResponse(token=new_token, expires_at=int(exp.timestamp()))

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=False)