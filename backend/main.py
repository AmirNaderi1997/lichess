import socketio
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import jwt
from datetime import datetime, timedelta
from game_logic import ChessGame
from puzzles import get_daily_puzzle
from database import get_db, User as DBUser
import uuid
import time
import random
import chess

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

# ─── Auth Setup ──────────────────────────────────────────────
SECRET_KEY = "lichess_secret_key_change_me"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class RegisterSchema(BaseModel):
    username: str
    email: str
    password: str

class LoginSchema(BaseModel):
    username: str
    password: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/api/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(DBUser).filter((DBUser.username == data.username) | (DBUser.email == data.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed_pw = pwd_context.hash(data.password)
    new_user = DBUser(username=data.username, email=data.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_access_token({"sub": new_user.username})
    return {"access_token": token, "token_type": "bearer", "user": {"username": new_user.username, "rating": new_user.rating}}

@app.post("/api/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.username == data.username).first()
    if not user or not pwd_context.verify(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "user": {"username": user.username, "rating": user.rating}}

# In-memory state
games = {}      # room_id -> ChessGame
challenges = {} # sid -> challenge_info
friend_links = {}  # link_code -> challenge_info (for "play with a friend")

LESSONS = [
    {
        "id": "l1", 
        "title": "Basic Piece Movements", "title_fa": "حرکات مقدماتی مهره‌ها",
        "category": "Fundamentals", "category_fa": "مبانی",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "time": "5m", 
        "description": "Master how every piece moves on the board.", 
        "description_fa": "یادگیری نحوه حرکت تمامی مهره‌ها در صفحه شطرنج.",
        "content": "The King moves one square in any direction. The Queen is the most powerful piece...",
        "content_fa": "شاه در هر جهت فقط یک خانه حرکت می‌کند. وزیر قدرتمندترین مهره در شطرنج است..."
    },
    {
        "id": "l2", 
        "title": "Checkmate Patterns", "title_fa": "الگوهای کیش و مات",
        "category": "Tactics", "category_fa": "تاکتیک",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "time": "10m", 
        "description": "Learn the most common ways to end the game.", 
        "description_fa": "یادگیری رایج‌ترین الگوها برای اتمام بازی.",
        "content": "The Scholar's Mate is a common checkmate. It targets the f7 square...",
        "content_fa": "مات ناپلئونی یکی از رایج‌ترین مات‌هاست. این مات خانه f7 را هدف قرار می‌دهد..."
    },
    {
        "id": "l3", 
        "title": "The Art of the Exchange", "title_fa": "هنر تعویض مهره‌ها",
        "category": "Tactics", "category_fa": "تاکتیک",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "time": "8m", 
        "description": "When to trade your pieces for an advantage.", 
        "description_fa": "چه زمانی مهره‌های خود را برای کسب برتری تعویض کنیم.",
        "content": "Trade your bishop for a knight when the position is closed. Keep the pair in open games...",
        "content_fa": "در وضعیت‌های بسته، فیل خود را با اسب تعویض کنید. در وضعیت‌های باز، جفت‌فیل را حفظ کنید..."
    },
    {
        "id": "l4", 
        "title": "Pawn Structures", "title_fa": "ساختارهای پیاده‌ای",
        "category": "Strategy", "category_fa": "استراتژی",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "time": "15m", 
        "description": "The skeleton of every chess game.", 
        "description_fa": "ستون فقرات و اسکلت‌بندی هر بازی شطرنج.",
        "content": "Doubled pawns can be a weakness, but they also provide semi-open files for your rooks...",
        "content_fa": "پیاده‌های دوبله می‌توانند نقطه ضعف باشند، اما ستون‌های نیمه‌باز برای رخ‌های شما فراهم می‌کنند..."
    },
    {
        "id": "l5", 
        "title": "Endgame Essentials", "title_fa": "ضروریات آخر بازی",
        "category": "Strategy", "category_fa": "استراتژی",
        "difficulty": "Advanced", "difficulty_fa": "پیشرفته",
        "time": "20m", 
        "description": "King and pawn endings in depth.", 
        "description_fa": "بررسی عمیق آخر بازی‌های شاه و پیاده.",
        "content": "Opposition is the most important concept in king and pawn endgames. Rule of the square...",
        "content_fa": "تقابل (اوپوزیسیون) مهم‌ترین مفهوم در آخر بازی‌های شاه و پیاده است. قانون مربع..."
    },
    {
        "id": "l6", 
        "title": "Modern Opening Theory", "title_fa": "تئوری گشایش‌های مدرن",
        "category": "Openings", "category_fa": "گشایش‌ها",
        "difficulty": "Advanced", "difficulty_fa": "پیشرفته",
        "time": "12m", 
        "description": "Survive the first 10 moves like a pro.", 
        "description_fa": "نحوه پشت سر گذاشتن ۱۰ حرکت اول مانند یک حرفه‌ای.",
        "content": "The Sicilian Defense is the most aggressive response to 1.e4. It leads to complex positions...",
        "content_fa": "دفاع سیسیلی تهاجمی‌ترین پاسخ به 1.e4 است. این دفاع منجر به وضعیت‌های پیچیده‌ای می‌شود..."
    },
]

COMMUNITY_POSTS = [
    {"id": "p1", "author": "GM_Master", "title": "Analysis of the recent Candidates Tournament", "title_fa": "تحلیل مسابقات کاندیداتوری اخیر", "timestamp": "2h ago", "likes": 42},
    {"id": "p2", "author": "ChessLover", "title": "New opening idea for Black in the Sicilian", "title_fa": "ایده گشایشی جدید برای سیاه در سیسیلی", "timestamp": "5h ago", "likes": 15},
    {"id": "p3", "author": "Admin", "title": "Community update: Patch notes v1.2", "title_fa": "به‌روزرسانی جامعه: یادداشت‌های وصله v1.2", "timestamp": "1d ago", "likes": 120},
]

# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────

async def broadcast_game_state(room: str):
    """Send the full current game state to everyone in a room."""
    game = games.get(room)
    if not game:
        return
    state = game.get_state()
    await sio.emit("game_state_update", {
        "state": state,
        "players": game.players
    }, room=room)

def pick_ai_move(board: chess.Board):
    """Simple AI: pick a random legal move."""
    legal = list(board.legal_moves)
    if not legal:
        return None
    # Prefer captures, then checks, then random
    captures = [m for m in legal if board.is_capture(m)]
    if captures:
        return random.choice(captures)
    checks = [m for m in legal if board.gives_check(m)]
    if checks:
        return random.choice(checks)
    return random.choice(legal)

def calculate_rating_change(current_rating, is_win):
    """
    Tiered scoring system:
    - < 500: Win +30, Loss -10
    - 500-1000: Win +20, Loss -10
    - > 1000: Win +10, Loss -7
    """
    if current_rating < 500:
        return 30 if is_win else -10
    elif 500 <= current_rating <= 1000:
        return 20 if is_win else -10
    else:  # > 1000
        return 10 if is_win else -7

async def update_player_rating(username, is_win, sid=None):
    """Updates the user rating in the database if the user is registered."""
    from database import SessionLocal, User as DBUser
    db = SessionLocal()
    try:
        user = db.query(DBUser).filter(DBUser.username == username).first()
        if user:
            change = calculate_rating_change(user.rating, is_win)
            user.rating = max(0, user.rating + change)
            db.commit()
            print(f"Rating Updated: {username} ({user.rating - change} -> {user.rating}) [{'Win' if is_win else 'Loss'}]")
            
            # Emit to user if sid is provided or broadcast to their room
            if sid:
                await sio.emit("rating_updated", {"rating": user.rating}, room=sid)
    except Exception as e:
        print(f"Error updating rating: {e}")
    finally:
        db.close()

# ─────────────────────────────────────────────
#  CONNECTION
# ─────────────────────────────────────────────

@sio.event
async def connect(sid, environ):
    print(f"Connected: {sid}")
    await sio.emit("lobby_update", list(challenges.values()), room=sid)
    await sio.emit("stats_update", {
        "online_players": len(sio.manager.rooms.get('/', {})),
        "active_games": len(games)
    }, room=sid)

@sio.event
async def disconnect(sid):
    print(f"Disconnected: {sid}")
    # Remove from matchmaking lobby
    if sid in challenges:
        del challenges[sid]
        print(f"Removed challenge for {sid}")
        await sio.emit("lobby_update", list(challenges.values()))

# ─────────────────────────────────────────────
#  MISC FEATURES
# ─────────────────────────────────────────────

@sio.event
async def get_lessons(sid):
    await sio.emit("lessons_list", LESSONS, room=sid)

@sio.event
async def get_community_posts(sid):
    await sio.emit("community_posts", COMMUNITY_POSTS, room=sid)

@sio.event
async def get_daily_puzzle_event(sid):
    """Send the puzzle of the day to the requesting client."""
    puzzle = get_daily_puzzle()
    await sio.emit("daily_puzzle", puzzle, room=sid)

@sio.event
async def get_puzzle(sid):
    """Send a random puzzle for the Puzzles page."""
    from puzzles import PUZZLE_COLLECTION
    puzzle = random.choice(PUZZLE_COLLECTION)
    await sio.emit("puzzle_data", puzzle, room=sid)

@sio.event
async def validate_puzzle_move(sid, data):
    puzzle_id = data.get("puzzle_id")
    move = data.get("move")
    
    # Check regular collection first
    from puzzles import PUZZLE_COLLECTION
    puzzle = next((p for p in PUZZLE_COLLECTION if p["id"] == puzzle_id), None)
    
    if puzzle and move in puzzle.get("solution_uci", []):
        await sio.emit("puzzle_result", {"success": True, "message": "Correct! Brilliant move!"}, room=sid)
    else:
        await sio.emit("puzzle_result", {"success": False, "message": "Incorrect — try again!"}, room=sid)

@sio.event
async def get_watch_games(sid):
    active_games = [
        {"room": gid, "players": game.players, "fen": game.get_state()["fen"]}
        for gid, game in games.items()
    ]
    await sio.emit("watch_games_list", active_games, room=sid)
    await sio.emit("lobby_update", list(challenges.values()), room=sid)

# ─────────────────────────────────────────────
#  MATCHMAKING (quick pair)
# ─────────────────────────────────────────────

@sio.event
async def quick_pairing(sid, data):
    time_control = data.get("time_control")
    username = data.get("username", "Guest")

    for other_sid, other_challenge in list(challenges.items()):
        if other_challenge["time_control"] == time_control and other_sid != sid:
            room = other_challenge["id"]
            creator_color = other_challenge["color"]
            joiner_color = "black" if creator_color == "white" else "white"

            del challenges[other_sid]
            await sio.emit("lobby_update", list(challenges.values()))

            print(f"Match found: {room}  {other_sid}={creator_color}  {sid}={joiner_color}")

            await sio.emit("match_found", {"room": room, "color": creator_color, "time_control": time_control}, room=other_sid)
            await sio.emit("match_found", {"room": room, "color": joiner_color, "time_control": time_control}, room=sid)
            return

    color_actual = random.choice(["white", "black"])
    challenge_id = f"game_{str(uuid.uuid4())[:8]}"
    challenge = {
        "id": challenge_id,
        "sid": sid,
        "username": username,
        "time_control": time_control,
        "color": color_actual,
        "created_at": time.time(),
    }
    challenges[sid] = challenge
    print(f"Queued: {challenge_id} for {username} ({sid}) as {color_actual}")
    await sio.emit("lobby_update", list(challenges.values()))

    await sio.emit("match_found", {"room": challenge_id, "color": color_actual, "time_control": time_control}, room=sid)

@sio.event
async def cancel_search(sid):
    if sid in challenges:
        del challenges[sid]
        print(f"Search cancelled by {sid}")
        await sio.emit("lobby_update", list(challenges.values()))

# ─────────────────────────────────────────────
#  CREATE A GAME (manual lobby challenge)
# ─────────────────────────────────────────────

@sio.event
async def create_challenge(sid, data):
    username = data.get("username", "Guest")
    time_control = data.get("time_control", "10+0")
    color = data.get("color", "random")
    color_actual = color if color in ("white", "black") else random.choice(["white", "black"])

    challenge_id = f"game_{str(uuid.uuid4())[:8]}"
    challenge = {
        "id": challenge_id,
        "sid": sid,
        "username": username,
        "time_control": time_control,
        "color": color_actual,
        "created_at": time.time(),
    }
    challenges[sid] = challenge
    await sio.emit("lobby_update", list(challenges.values()))
    await sio.emit("match_found", {"room": challenge_id, "color": color_actual, "time_control": time_control}, room=sid)

# ─────────────────────────────────────────────
#  PLAY WITH A FRIEND (shareable link)
# ─────────────────────────────────────────────

@sio.event
async def create_friend_challenge(sid, data):
    """Create a private room and return a link code for a friend to join."""
    username = data.get("username", "Guest")
    time_control = data.get("time_control", "10+0")
    color = data.get("color", "random")
    color_actual = color if color in ("white", "black") else random.choice(["white", "black"])

    link_code = str(uuid.uuid4())[:8]
    room = f"friend_{link_code}"

    friend_links[link_code] = {
        "room": room,
        "creator_sid": sid,
        "creator_username": username,
        "creator_color": color_actual,
        "time_control": time_control,
        "created_at": time.time(),
    }

    print(f"Friend challenge created: {link_code} by {username} as {color_actual}")
    await sio.emit("friend_link_created", {"link_code": link_code, "room": room, "color": color_actual, "time_control": time_control}, room=sid)

@sio.event
async def join_friend_challenge(sid, data):
    """Join a game via link code."""
    link_code = data.get("link_code", "")
    username = data.get("username", "Guest")
    client_id = data.get("clientId", sid)

    if link_code not in friend_links:
        await sio.emit("error", {"message": "Invalid or expired challenge link"}, room=sid)
        return

    info = friend_links[link_code]
    room = info["room"]
    creator_color = info["creator_color"]
    joiner_color = "black" if creator_color == "white" else "white"
    time_control = info["time_control"]

    # Notify both
    await sio.emit("match_found", {"room": room, "color": creator_color, "time_control": time_control}, room=info["creator_sid"])
    await sio.emit("match_found", {"room": room, "color": joiner_color, "time_control": time_control}, room=sid)

    # Cleanup
    del friend_links[link_code]

# ─────────────────────────────────────────────
#  PLAY WITH MACHINE (AI)
# ─────────────────────────────────────────────

@sio.event
async def play_vs_ai(sid, data):
    """Start a game against a simple AI opponent."""
    username = data.get("username", "Guest")
    time_control = data.get("time_control", "10+0")
    color = data.get("color", "random")
    color_actual = color if color in ("white", "black") else random.choice(["white", "black"])
    ai_color = "black" if color_actual == "white" else "white"

    room = f"ai_{str(uuid.uuid4())[:8]}"
    client_id = data.get("clientId", sid)

    games[room] = ChessGame(room_id=room, time_control=time_control)
    game = games[room]

    # Assign human
    game.players[color_actual] = {"sid": sid, "username": username, "clientId": client_id}
    # Assign AI
    game.players[ai_color] = {"sid": "AI", "username": "Stockfish Lite ♟", "clientId": "AI_BOT"}
    game.is_ready = True
    game.start()

    print(f"AI game started: {room} — {username}={color_actual}, AI={ai_color}")

    # Tell the frontend "match found"
    await sio.emit("match_found", {"room": room, "color": color_actual, "time_control": time_control, "vs_ai": True}, room=sid)

    # If AI is white, make AI's first move after a short delay
    if ai_color == "white":
        await _do_ai_move(room)

async def _do_ai_move(room):
    """Have the AI make a move in the given room."""
    game = games.get(room)
    if not game or game.get_state()["is_game_over"]:
        return
    
    ai_move = pick_ai_move(game.board)
    if ai_move:
        move_uci = ai_move.uci()
        success, result = game.make_move(move_uci)
        if success:
            await sio.emit("move_made", {"state": result, "move": move_uci}, room=room)

# ─────────────────────────────────────────────
#  GAME EVENTS
# ─────────────────────────────────────────────

@sio.event
async def join_game(sid, data):
    room        = data.get("room", "default")
    username    = data.get("username", "Guest")
    pref_color  = data.get("color")
    client_id   = data.get("clientId", sid)

    await sio.enter_room(sid, room)

    if room not in games:
        games[room] = ChessGame(room_id=room, time_control=data.get("time_control", "10+0"))
    game = games[room]

    # --- Re-connect: find existing slot by clientId ---
    player_color = None
    for color, p in game.players.items():
        if p and p.get("clientId") == client_id:
            p["sid"] = sid
            player_color = color
            print(f"Reconnect: {username} ({client_id}) reclaimed {color} in {room}")
            break

    # --- New player: assign slot ---
    if not player_color:
        if pref_color in ("white", "black") and game.players[pref_color] is None:
            game.players[pref_color] = {"sid": sid, "username": username, "clientId": client_id}
            player_color = pref_color
        elif game.players["white"] is None:
            game.players["white"] = {"sid": sid, "username": username, "clientId": client_id}
            player_color = "white"
        elif game.players["black"] is None:
            game.players["black"] = {"sid": sid, "username": username, "clientId": client_id}
            player_color = "black"
        else:
            game.spectators.append({"sid": sid, "username": username, "clientId": client_id})
            player_color = "spectator"

    # --- Update ready flag ---
    if game.players["white"] and game.players["black"]:
        game.is_ready = True
        game.start()

    w = game.players["white"]["username"] if game.players["white"] else "—"
    b = game.players["black"]["username"] if game.players["black"] else "—"
    print(f"{username} joined {room} as {player_color}. Ready={game.is_ready}  W={w} B={b}")

    await sio.emit("game_state", {
        "state": game.get_state(),
        "color": player_color,
        "players": game.players,
    }, room=sid)

    await broadcast_game_state(room)

@sio.event
async def make_move(sid, data):
    room      = data.get("room", "default")
    move_uci  = data.get("move")
    client_id = data.get("clientId")

    if room not in games:
        await sio.emit("error", {"message": "Room not found"}, room=sid)
        return

    game  = games[room]
    state = game.get_state()

    if not game.is_ready:
        await sio.emit("error", {"message": "Game not ready yet"}, room=sid)
        return

    player_turn     = state["turn"]
    assigned_player = game.players[player_turn]

    if not assigned_player:
        await sio.emit("error", {"message": "No player assigned"}, room=sid)
        return

    is_correct_client = assigned_player.get("clientId") == client_id
    is_correct_sid    = assigned_player.get("sid") == sid
    if not (is_correct_client or is_correct_sid):
        await sio.emit("error", {"message": "Not your turn"}, room=sid)
        return

    success, result = game.make_move(move_uci)
    if success:
        await sio.emit("move_made", {"state": result, "move": move_uci}, room=room)

        # --- Handle Game Over & Ratings ---
        if result.get("is_game_over"):
            white_user = game.players["white"]["username"]
            black_user = game.players["black"]["username"]
            
            if result.get("is_checkmate"):
                # The turn in 'result' is the turn of the player who was about to move (the one who lost)
                winner_color = "black" if result["turn"] == "white" else "white"
                loser_color = "white" if winner_color == "black" else "black"
                
                winner_name = game.players[winner_color]["username"]
                loser_name = game.players[loser_color]["username"]
                
                winner_sid = game.players[winner_color]["sid"]
                loser_sid = game.players[loser_color]["sid"]
                
                await update_player_rating(winner_name, True, winner_sid)
                await update_player_rating(loser_name, False, loser_sid)
                await sio.emit("game_over", {"result": f"Checkmate! {winner_name} wins", "winner": winner_name}, room=room)
            else:
                # Draw, stalemate, etc. (No rating change for now as per instructions, or we could add minor changes)
                await sio.emit("game_over", {"result": "Draw"}, room=room)

        # --- Handle AI Move ---
        if room.startswith("ai_") and not result.get("is_game_over", False):
            import asyncio
            await asyncio.sleep(0.5)
            await _do_ai_move(room)
    else:
        await sio.emit("error", {"message": result}, room=sid)

@sio.event
async def resign(sid, data):
    room = data.get("room")
    username = data.get("username")
    if room in games:
        game = games[room]
        # Identify who resigned
        resigner_color = None
        for color, p in game.players.items():
            if p and p.get("username") == username:
                resigner_color = color
                break
        
        if resigner_color:
            winner_color = "black" if resigner_color == "white" else "white"
            winner_name = game.players[winner_color]["username"]
            winner_sid = game.players[winner_color]["sid"]
            
            await update_player_rating(username, False, sid) # Resigner loses
            await update_player_rating(winner_name, True, winner_sid)  # Winner wins
            
            await sio.emit("game_over", {"result": f"{username} resigned. {winner_name} wins", "winner": winner_name}, room=room)
            # Remove game from active games after some time or immediately
            # games.pop(room, None)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)
