import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import httpx

from dotenv import load_dotenv

load_dotenv()

# Configuration from environment variables
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_EXPIRATION_HOURS = 1
JWT_EXPIRATION_DAYS_REMEMBER = 7

# oauth config from .env file
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_AUTH_URI = os.getenv("GOOGLE_AUTH_URI")
GOOGLE_TOKEN_URI = os.getenv("GOOGLE_TOKEN_URI")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")


security = HTTPBearer(auto_error=False)


def generate_jwt(payload: dict, remember_me: bool = False) -> str:
    """Generate a JWT token"""
    if remember_me:
        expiration = datetime.utcnow() + timedelta(days=JWT_EXPIRATION_DAYS_REMEMBER)
    else:
        expiration = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)

    token_payload = {
        **payload,
        "exp": expiration,
        "iat": datetime.utcnow()
    }

    return jwt.encode(token_payload, JWT_SECRET_KEY)


def decode_jwt(token: str) -> Optional[dict]:
    """Decode any JWT token"""
    try:
        # try to decode with verification
        return jwt.decode(token, JWT_SECRET_KEY)
    except:
        # If that fails, just decode without verification (for Google tokens)
        try:
            return jwt.decode(token, options={"verify_signature": False})
        except:
            return None


async def exchange_code_for_token(code: str) -> Optional[dict]:
    """
    Exchange authorization code for tokens
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GOOGLE_TOKEN_URI,
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code"
                }
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"Token exchange failed: {response.status_code} - {response.text}")
                return None
    except Exception as e:
        print(f"Error exchanging code for token: {e}")
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    payload = decode_jwt(credentials.credentials)
    return payload


async def require_auth( credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated - No token provided")

    payload = decode_jwt(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload


async def require_admin(user: dict = Depends(require_auth)) -> dict:
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")

    return user


def get_token_from_request(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    return None