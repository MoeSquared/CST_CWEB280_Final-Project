from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from typing import Optional
from urllib.parse import urlencode

from database.db import Session
from schemas.user_model import User
from middlewares.auth_middleware import (
    generate_jwt, decode_jwt, exchange_code_for_token, require_auth, require_admin,
    GOOGLE_CLIENT_ID, GOOGLE_AUTH_URI, GOOGLE_REDIRECT_URI
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])


class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None


class UserUpdateRequest(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None


def find_user_by_user_info(user_info: dict):
    """
    Find user in our database by email (like findUserByUserInfo in class).
    Returns user dict if found, None otherwise.
    """
    email = user_info.get('email')
    if not email:
        return None

    with Session() as session:
        user = session.query(User).filter_by(email=email).first()
        if user:
            return {
                "id": user.id,
                "email": user.email,
                "firstName": user.firstName,
                "lastName": user.lastName,
                "role": user.role
            }
        return None


# Initialize default users (admin and test user)
def init_default_users():
    """Create default users if they don't exist"""
    with Session() as session:
        # Check for admin user
        admin = session.query(User).filter_by(email="test@t.ca").first()
        if not admin:
            admin = User(
                email="test@t.ca",
                password="123456Pw",
                firstName="Test",
                lastName="User",
                role="admin",
                is_google_user=False
            )
            session.add(admin)
            print("Created admin user: test@t.ca")

        # Check for Google test user (Ernesto)
        google_user = session.query(User).filter_by(email="ebasotest@gmail.com").first()
        if not google_user:
            google_user = User(
                email="ebasotest@gmail.com",
                password=None,
                firstName="Ernesto",
                lastName="Baso",
                role="user",
                is_google_user=True
            )
            session.add(google_user)
            print("Created Ernesto: ebasotest@gmail.com")

        # Check for your account
        my_account = session.query(User).filter_by(email="beast.khan82@gmail.com").first()
        if not my_account:
            my_account = User(
                email="beast.khan82@gmail.com",
                password=None,
                firstName="Moe",
                lastName="Khan",
                role="admin",
                is_google_user=True
            )
            session.add(my_account)
            print("Created my account: beast.khan82@gmail.com")

        session.commit()


@router.post("/login")
async def login(request: LoginRequest):
    """Login with email and password."""
    with Session() as session:
        user = session.query(User).filter_by(email=request.email).first()

        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if user.is_google_user and not user.password:
            raise HTTPException(
                status_code=401,
                detail="This account uses Google Sign-In. Please use the Google login button."
            )

        if user.password != request.password:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = generate_jwt(
            {"id": user.id, "email": user.email, "firstName": user.firstName,
             "lastName": user.lastName, "role": user.role},
            remember_me=request.remember_me
        )

        return {"token": token, "userInfo": user.to_dictionary()}


@router.post("/register")
async def register(request: RegisterRequest):
    """Register a new user with email and password."""
    with Session() as session:
        existing_user = session.query(User).filter_by(email=request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        if len(request.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

        # Use provided names or derive from email
        first_name = request.firstName or request.email.split('@')[0]
        last_name = request.lastName or ""

        new_user = User(
            email=request.email,
            password=request.password,
            firstName=first_name,
            lastName=last_name,
            role="user",
            is_google_user=False
        )

        session.add(new_user)
        session.commit()
        session.refresh(new_user)

        token = generate_jwt({
            "id": new_user.id,
            "email": new_user.email,
            "firstName": new_user.firstName,
            "lastName": new_user.lastName,
            "role": new_user.role
        })

        return {"token": token, "userInfo": new_user.to_dictionary()}


@router.get("/google/login")
async def google_login():
    """
    Redirects to Google's authorization page.
    """
    params = urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "email profile"
    })

    google_url = f"{GOOGLE_AUTH_URI}?{params}"
    return RedirectResponse(url=google_url)


@router.get("/google/callback")
async def google_callback(credential: str = None, code: str = None):
    """
    Google OAuth callback

    Handles both:
    1. 'credential' from UI "Sign in with Google" button
    2. 'code' from OAuth redirect flow
    """
    try:
        # Default: look for credential from UI "Sign in with Google" response
        google_token_result = {"id_token": credential}

        # Check if redirected from GOOGLE_AUTH_URI with authorization code
        if code:
            # Call GOOGLE_TOKEN_URI to get id_token from the google authorization code
            google_token_result = await exchange_code_for_token(code)
            if not google_token_result:
                raise Exception("Google Authentication failed")

        # Get the id_token from googleTokenResult and decode it to get a google profile object
        id_token = google_token_result.get("id_token")
        google_user_profile = decode_jwt(id_token)

        if not google_user_profile:
            raise Exception("Google Authentication failed")

        print(f"Google user profile: {google_user_profile.get('email')}")

        # Inside googleUserProfile there is an email property - use that to find the user in our store
        user_info = find_user_by_user_info(google_user_profile)

        # reject user if not found in our store
        if not user_info:
            raise Exception("No local user found - check email address")

        print(f"ALLOWED: {user_info['email']} - User found in database")

        # make our own token from the user found in the data store
        token = generate_jwt(user_info)

        # respond with json
        return {"token": token, "userInfo": user_info}

    except Exception as error:
        print(f"Error: {error}")
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/google")
async def google_auth_post(request: dict):
    """
    Google OAuth via POST
    """
    try:
        credential = request.get("credential")
        google_user_profile = decode_jwt(credential)

        if not google_user_profile:
            raise Exception("Google Authentication failed")

        email = google_user_profile.get('email')
        given_name = google_user_profile.get('given_name', '')
        family_name = google_user_profile.get('family_name', '')

        # Fallback if names aren't provided
        if not given_name and not family_name:
            full_name = google_user_profile.get('name', email.split('@')[0])
            parts = full_name.split(' ', 1)
            given_name = parts[0]
            family_name = parts[1] if len(parts) > 1 else ''

        with Session() as session:
            user = session.query(User).filter_by(email=email).first()

            if not user:
                # Create new Google user
                user = User(
                    email=email,
                    firstName=given_name,
                    lastName=family_name,
                    role="user",
                    is_google_user=True
                )
                session.add(user)
                session.commit()
                session.refresh(user)

            user_info = user.to_dictionary()
            token = generate_jwt(user_info)

            return {"token": token, "userInfo": user_info}

    except Exception as error:
        print(f"Error: {error}")
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/verify")
async def verify_token(user: dict = Depends(require_auth)):
    """Verify if the current token is valid."""
    return {
        "valid": True,
        "userInfo": {
            "id": user.get('id'),
            "email": user.get('email'),
            "firstName": user.get('firstName'),
            "lastName": user.get('lastName'),
            "role": user.get('role')
        }
    }


# User Management Endpoints (Admin only)
@router.get("/users")
async def get_all_users(admin: dict = Depends(require_admin)):
    with Session() as session:
        users = session.query(User).all()
        return [user.to_dictionary() for user in users]


@router.get("/users/{user_id}")
async def get_user(user_id: int, admin: dict = Depends(require_admin)):
    with Session() as session:
        user = session.query(User).filter_by(id=user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user.to_dictionary()


@router.patch("/users/{user_id}")
async def update_user(
        user_id: int,
        request: UserUpdateRequest,
        current_user: dict = Depends(require_auth)
):
    if current_user.get('id') != user_id and current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="You can only update your own profile")

    if request.role and current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can change user roles")

    with Session() as session:
        user = session.query(User).filter_by(id=user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if request.firstName is not None:
            user.firstName = request.firstName
        if request.lastName is not None:
            user.lastName = request.lastName
        if request.email is not None:
            existing = session.query(User).filter_by(email=request.email).first()
            if existing and existing.id != user_id:
                raise HTTPException(status_code=400, detail="Email already in use")
            user.email = request.email
        if request.role is not None:
            user.role = request.role

        session.commit()
        session.refresh(user)
        return user.to_dictionary()


@router.delete("/users/{user_id}")
async def delete_user(
        user_id: int,
        current_user: dict = Depends(require_auth)
):
    with Session() as session:
        user = session.query(User).filter_by(id=user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.role == 'admin':
            admin_count = session.query(User).filter_by(role='admin').count()
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot delete the last admin account")

        session.delete(user)
        session.commit()
        return {"message": "User deleted successfully", "id": user_id}