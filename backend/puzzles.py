"""
Daily Puzzle system — rotates one puzzle per calendar day from a curated collection.
"""
import hashlib
from datetime import date

# A curated collection of 50 chess puzzles (FEN + solution + metadata + localizations)
PUZZLE_COLLECTION = [
    {
        "id": "daily_01",
        "fen": "r2qkb1r/pp2nppp/3p4/2pNN1B1/2BnP3/3P4/PPP2PPP/R2bK2R w KQkq - 1 1",
        "solution": ["Nd5xf6+", "Nf6"],
        "solution_uci": ["d5f6"],
        "title": "Knight Fork Masterclass",
        "hint": "Check the f6 square, it's poorly defended.",
        "hint_fa": "خانه f6 را بررسی کنید، به خوبی دفاع نشده است.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Fork", "theme_fa": "چنگال",
        "turn": "white"
    },
    {
        "id": "daily_02",
        "fen": "r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 5 5",
        "solution": ["Bg5"],
        "solution_uci": ["c1g5"],
        "title": "Pin the Knight",
        "hint": "Your dark-squared bishop can annoy the f6 knight.",
        "hint_fa": "فیل سیاه شما می‌تواند اسب f6 را آزار دهد.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Pin", "theme_fa": "آچمز",
        "turn": "white"
    },
    {
        "id": "daily_03",
        "fen": "r1bqr1k1/ppp2ppp/2np1n2/2b1p1B1/2B1P3/3P1N2/PPP1NPPP/R2QK2R w KQ - 6 7",
        "solution": ["Nd5"],
        "solution_uci": ["e2d5"],
        "title": "Central Knight Outpost",
        "hint": "The d5 square is a perfect home for your knight.",
        "hint_fa": "خانه d5 یک خانه عالی برای اسب شماست.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Strategy", "theme_fa": "استراتژی",
        "turn": "white"
    },
    {
        "id": "daily_04",
        "fen": "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2",
        "solution": ["Qh4#"],
        "solution_uci": ["d8h4"],
        "title": "Fool's Mate",
        "hint": "The e1-h4 diagonal is dangerously open.",
        "hint_fa": "قطر e1-h4 به طور خطرناکی باز است.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Checkmate", "theme_fa": "کیش و مات",
        "turn": "black"
    },
    {
        "id": "daily_05",
        "fen": "r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
        "solution": ["d4"],
        "solution_uci": ["d2d4"],
        "title": "Gain the Center",
        "hint": "Two pawns in the center are better than one.",
        "hint_fa": "دو پیاده در مرکز بهتر از یکی است.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "white"
    },
    {
        "id": "daily_06",
        "fen": "r2q1rk1/ppp1bppp/2n1bn2/3pp3/8/1BN1PN2/PPPP1PPP/R1BQ1RK1 w - - 0 8",
        "solution": ["Nd5"],
        "solution_uci": ["c3d5"],
        "title": "Outpost Domination",
        "hint": "Jump into the center and pressure the e7 bishop.",
        "hint_fa": "به مرکز بپرید و به فیل e7 فشار بیاورید.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Strategy", "theme_fa": "استراتژی",
        "turn": "white"
    },
    {
        "id": "daily_07",
        "fen": "r1bq2k1/ppp2ppp/2n5/3p4/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQ - 0 7",
        "solution": ["Ng5"],
        "solution_uci": ["f3g5"],
        "title": "Italian Game Attack",
        "hint": "The f7 pawn is only defended by the king.",
        "hint_fa": "پیاده f7 تنها توسط شاه دفاع می‌شود.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Attack", "theme_fa": "حمله",
        "turn": "white"
    },
    {
        "id": "daily_08",
        "fen": "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        "solution": ["d3"],
        "solution_uci": ["d2d3"],
        "title": "Giuoco Piano",
        "hint": "Support your e4 pawn and open your dark-squared bishop.",
        "hint_fa": "از پیاده e4 خود حمایت کنید و راه فیل سیاه خود را باز کنید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "white"
    },
    {
        "id": "daily_09",
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        "solution": ["Ng5"],
        "solution_uci": ["f3g5"],
        "title": "Fried Liver Setup",
        "hint": "Combine your queen and knight's pressure on f7.",
        "hint_fa": "فشار وزیر و اسب خود را روی f7 ترکیب کنید.",
        "difficulty": "Advanced", "difficulty_fa": "پیشرفته",
        "theme": "Attack", "theme_fa": "حمله",
        "turn": "white"
    },
    {
        "id": "daily_10",
        "fen": "rnb1kbnr/pppp1ppp/8/4p3/5PPq/8/PPPPP2P/RNBQKBNR w KQkq - 1 3",
        "solution": ["g5"],
        "solution_uci": ["g4g5"],
        "title": "Defend the King",
        "hint": "Block the check and push the attacker away.",
        "hint_fa": "کیش را مسدود کنید و مهاجم را دور کنید.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Defense", "theme_fa": "دفاع",
        "turn": "white"
    },
    {
        "id": "daily_11",
        "fen": "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
        "solution": ["O-O"],
        "solution_uci": ["e1g1"],
        "title": "Ruy Lopez Castle",
        "hint": "King safety first before starting an attack.",
        "hint_fa": "قبل از شروع حمله، ابتدا امنیت شاه را تامین کنید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "white"
    },
    {
        "id": "daily_12",
        "fen": "r1bqk2r/ppp2ppp/2n1pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQK2R b KQkq - 3 6",
        "solution": ["dxc4"],
        "solution_uci": ["d5c4"],
        "title": "Win a Pawn",
        "hint": "The c4 pawn is hanging, take it!",
        "hint_fa": "پیاده c4 بی‌دفاع است، آن را بگیرید!",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Tactics", "theme_fa": "تاکتیک",
        "turn": "black"
    },
    {
        "id": "daily_13",
        "fen": "r2qkb1r/ppp1pppp/2n2n2/3p4/3P1Bb1/4PN2/PPP2PPP/RN1QKB1R w KQkq - 3 4",
        "solution": ["Bb5"],
        "solution_uci": ["f1b5"],
        "title": "Pin and Win",
        "hint": "Pin the knight to the king and increase pressure.",
        "hint_fa": "اسب را به شاه آچمز کنید و فشار را افزایش دهید.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Pin", "theme_fa": "آچمز",
        "turn": "white"
    },
    {
        "id": "daily_14",
        "fen": "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5",
        "solution": ["O-O"],
        "solution_uci": ["e1g1"],
        "title": "Castle Under Pressure",
        "hint": "Don't let the pin stop you from castling.",
        "hint_fa": "اجازه ندهید آچمز مانع قلعه رفتن شما شود.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Defense", "theme_fa": "دفاع",
        "turn": "white"
    },
    {
        "id": "daily_15",
        "fen": "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
        "solution": ["e5"],
        "solution_uci": ["e4e5"],
        "title": "Alekhine's Defense Advance",
        "hint": "Push the pawn and gain tempo on the knight.",
        "hint_fa": "پیاده را پیش برانید و از اسب زمان (تمپو) بگیرید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "white"
    },
    {
        "id": "daily_16",
        "fen": "r1bq1rk1/ppppbppp/2n1pn2/8/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQ - 4 6",
        "solution": ["Bd3"],
        "solution_uci": ["f1d3"],
        "title": "Queen's Gambit Setup",
        "hint": "The d3 square is the most active for the light-squared bishop.",
        "hint_fa": "خانه d3 فعال‌ترین خانه برای فیل سفیدرو است.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "white"
    },
    {
        "id": "daily_17",
        "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/4P3/2NP1N2/PPP2PPP/R1BQKB1R w KQkq - 1 5",
        "solution": ["Be2"],
        "solution_uci": ["f1e2"],
        "title": "Prepare to Castle",
        "hint": "Complete your development and get ready to castle.",
        "hint_fa": "گسترش خود را کامل کنید و برای قلعه آماده شوید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Development", "theme_fa": "گسترش",
        "turn": "white"
    },
    {
        "id": "daily_18",
        "fen": "rn1qkb1r/pp2pppp/2c2n2/3p4/3P1Bb1/4PN2/PPP2PPP/RN1QKB1R w KQkq - 0 5",
        "solution": ["h3"],
        "solution_uci": ["h2h3"],
        "title": "Ask the Bishop",
        "hint": "Force the bishop to either capture or retreat.",
        "hint_fa": "فیل را مجبور کنید یا بزند یا عقب‌نشینی کند.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Tactics", "theme_fa": "تاکتیک",
        "turn": "white"
    },
    {
        "id": "daily_19",
        "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        "solution": ["Bb5"],
        "solution_uci": ["f1b5"],
        "title": "Ruy Lopez",
        "hint": "Challenge the knight on c6 immediately.",
        "hint_fa": "بلافاصله اسب c6 را به چالش بکشید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "white"
    },
    {
        "id": "daily_20",
        "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        "solution": ["e5"],
        "solution_uci": ["e7e5"],
        "title": "Open Game",
        "hint": "Mirror white's central move.",
        "hint_fa": "حرکت مرکزی سفید را تقلید (قرینه) کنید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "black"
    },
    {
        "id": "daily_21",
        "fen": "r1b1kb1r/ppppqppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 6 5",
        "solution": ["d4"],
        "solution_uci": ["d2d4"],
        "title": "Center Strike",
        "hint": "Break through and open lines for your pieces.",
        "hint_fa": "مرکز را بشکنید و خطوط را برای مهره‌های خود باز کنید.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Tactics", "theme_fa": "تاکتیک",
        "turn": "white"
    },
    {
        "id": "daily_22",
        "fen": "rnbqk2r/ppppppbp/5np1/8/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
        "solution": ["e4"],
        "solution_uci": ["e2e4"],
        "title": "King's Indian Pawn Storm",
        "hint": "Build your massive central pawn shield.",
        "hint_fa": "سپر پیاده‌ای عظیم خود را در مرکز بسازید.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "white"
    },
    {
        "id": "daily_23",
        "fen": "rnbqkb1r/ppp1pppp/3p1n2/8/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",
        "solution": ["Nc3"],
        "solution_uci": ["b1c3"],
        "title": "Pirc Defense",
        "hint": "Develop another piece and support e4.",
        "hint_fa": "مهره دیگری را گسترش دهید و از e4 حمایت کنید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Development", "theme_fa": "گسترش",
        "turn": "white"
    },
    {
        "id": "daily_24",
        "fen": "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2",
        "solution": ["Nf3"],
        "solution_uci": ["g1f3"],
        "title": "Anti-Sicilian Setup",
        "hint": "Develop the kingside knight first.",
        "hint_fa": "ابتدا اسب جناح شاه را گسترش دهید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "white"
    },
    {
        "id": "daily_25",
        "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
        "solution": ["Nf6"],
        "solution_uci": ["g8f6"],
        "title": "Two Knights Defense",
        "hint": "Challenge the e4 pawn while developing.",
        "hint_fa": "هنگام گسترش، پیاده e4 را به چالش بکشید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "black"
    },
    {
        "id": "daily_26",
        "fen": "r1bqk2r/pppp1ppp/2nb1n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 6 6",
        "solution": ["d4"],
        "solution_uci": ["d2d4"],
        "title": "Open the Center",
        "hint": "Striking the center is the key theme here.",
        "hint_fa": "ضربه زدن به مرکز، تم اصلی در اینجا است.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Strategy", "theme_fa": "استراتژی",
        "turn": "white"
    },
    {
        "id": "daily_27",
        "fen": "rnbqkb1r/pp1ppppp/5n2/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        "solution": ["Nc3"],
        "solution_uci": ["b1c3"],
        "title": "Sicilian Development",
        "hint": "Focus on natural development.",
        "hint_fa": "بر گسترش طبیعی تمرکز کنید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "white"
    },
    {
        "id": "daily_28",
        "fen": "r1bqk2r/pppp1Bpp/2n2n2/2b1p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4",
        "solution": ["Kxf7"],
        "solution_uci": ["e8f7"],
        "title": "Forced Recapture",
        "hint": "The king must deal with the check.",
        "hint_fa": "شاه باید با کیش مقابله کند.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Tactics", "theme_fa": "تاکتیک",
        "turn": "black"
    },
    {
        "id": "daily_29",
        "fen": "r2qk2r/ppp1bppp/2n1bn2/3pp3/4P3/1BN2N2/PPPP1PPP/R1BQ1RK1 w kq - 0 7",
        "solution": ["exd5"],
        "solution_uci": ["e4d5"],
        "title": "Central Exchange",
        "hint": "Exchange the central pawns to sharpen the game.",
        "hint_fa": "پیاده‌های مرکزی را تعویض کنید تا بازی داغ شود.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Strategy", "theme_fa": "استراتژی",
        "turn": "white"
    },
    {
        "id": "daily_30",
        "fen": "r1bqkbnr/pppppppp/2n5/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2",
        "solution": ["d5"],
        "solution_uci": ["d7d5"],
        "title": "Scandinavian Counter",
        "hint": "Challenge the e4 pawn right away.",
        "hint_fa": "بلافاصله پیاده e4 را به چالش بکشید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "black"
    },
    # --- EXPANDED COLLECTION (31-50) ---
    {
        "id": "daily_31",
        "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 6 5",
        "solution": ["Bxf7+"],
        "solution_uci": ["c4f7"],
        "title": "Sacrifice on f7",
        "hint": "The f7 pawn is vulnerable. Can you strike?",
        "hint_fa": "پیاده f7 آسیب‌پذیر است. می‌توانید ضربه بزنید؟",
        "difficulty": "Advanced", "difficulty_fa": "پیشرفته",
        "theme": "Sacrifice", "theme_fa": "قربانی",
        "turn": "white"
    },
    {
        "id": "daily_32",
        "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3",
        "solution": ["d3"],
        "solution_uci": ["d2d3"],
        "title": "Solid Development",
        "hint": "Keep it simple and support the center.",
        "hint_fa": "ساده بازی کنید و از مرکز حمایت کنید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "white"
    },
    {
        "id": "daily_33",
        "fen": "1r2r1k1/p4pbp/2pp2p1/q4b2/2P5/BPNn2P1/P2Q1PBP/2RR2K1 w - - 4 19",
        "solution": ["Bxc6"],
        "solution_uci": ["g2c6"],
        "title": "Pin Manipulation",
        "hint": "Look for collateral damage in the center.",
        "hint_fa": "به دنبال آسیب‌های جانبی در مرکز باشید.",
        "difficulty": "Elite", "difficulty_fa": "نخبه",
        "theme": "Tactics", "theme_fa": "تاکتیک",
        "turn": "white"
    },
    {
        "id": "daily_34",
        "fen": "r2qk2r/ppp1bppp/2n1bn2/3pp3/4P3/1BNP1N2/PPP2PPP/R1BQ1RK1 w kq - 1 7",
        "solution": ["Nxe5"],
        "solution_uci": ["f3e5"],
        "title": "Tactical Strike",
        "hint": "Is the e5 pawn really defended?",
        "hint_fa": "آیا پیاده e5 واقعاً دفاع شده است؟",
        "difficulty": "Advanced", "difficulty_fa": "پیشرفته",
        "theme": "Tactics", "theme_fa": "تاکتیک",
        "turn": "white"
    },
    {
        "id": "daily_35",
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4",
        "solution": ["d4"],
        "solution_uci": ["d2d4"],
        "title": "Four Knights Center",
        "hint": "Classical center break is often best.",
        "hint_fa": "شکستن کلاسیک مرکز اغلب بهترین است.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "white"
    },
    {
        "id": "daily_36",
        "fen": "rn1qk2r/ppp1bppp/3p1n2/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 6",
        "solution": ["h3"],
        "solution_uci": ["h2h3"],
        "title": "Probe the Bishop",
        "hint": "Force the bishop to reveal its intentions.",
        "hint_fa": "فیل را مجبور کنید قصد خود را آشکار کند.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Strategy", "theme_fa": "استراتژی",
        "turn": "white"
    },
    {
        "id": "daily_37",
        "fen": "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        "solution": ["d3"],
        "solution_uci": ["d2d3"],
        "title": "Quiet Development",
        "hint": "Slow and steady wins the race.",
        "hint_fa": "آهسته و پیوسته پیروز میدان است.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "white"
    },
    {
        "id": "daily_38",
        "fen": "r1bqk2r/ppp2ppp/2n1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQK2R b KQkq - 1 6",
        "solution": ["O-O"],
        "solution_uci": ["e8g8"],
        "title": "Safety First",
        "hint": "Your king needs a secure home.",
        "hint_fa": "شاه شما به یک خانه امن نیاز دارد.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Development", "theme_fa": "گسترش",
        "turn": "black"
    },
    {
        "id": "daily_39",
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R b KQkq - 5 4",
        "solution": ["Nxe4"],
        "solution_uci": ["f6e4"],
        "title": "Fork Trick",
        "hint": "A tactical sacrifice to gain the center.",
        "hint_fa": "یک قربانی تاکتیکی برای به دست آوردن مرکز.",
        "difficulty": "Advanced", "difficulty_fa": "پیشرفته",
        "theme": "Tactics", "theme_fa": "تاکتیک",
        "turn": "black"
    },
    {
        "id": "daily_40",
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4",
        "solution": ["Bc5"],
        "solution_uci": ["f8c5"],
        "title": "Classical Development",
        "hint": "Develop your pieces toward the center.",
        "hint_fa": "مهره‌های خود را به سمت مرکز گسترش دهید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "black"
    },
    {
        "id": "daily_41",
        "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R b KQkq - 0 5",
        "solution": ["d6"],
        "solution_uci": ["d7d6"],
        "title": "Solidify the Center",
        "hint": "Support e5 and prepare light-square bishop development.",
        "hint_fa": "از e5 حمایت کنید و برای گسترش فیل سفیدرو آماده شوید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "black"
    },
    {
        "id": "daily_42",
        "fen": "r2qk2r/ppp1bppp/2n1bn2/3pp3/4P3/1BNP1N2/PPP1QPPP/R1B1K2R b KQkq - 1 7",
        "solution": ["d4"],
        "solution_uci": ["d5d4"],
        "title": "Space Advantage",
        "hint": "Push ahead and cramp white's position.",
        "hint_fa": "به جلو برانید و وضعیت سفید را تنگ کنید.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Strategy", "theme_fa": "استراتژی",
        "turn": "black"
    },
    {
        "id": "daily_43",
        "fen": "r1bqk2r/ppp2ppp/2n1pn2/1B1p4/2PP4/2N1PN2/PP3PPP/R1BQK2R b KQkq - 2 6",
        "solution": ["Bd7"],
        "solution_uci": ["c8d7"],
        "title": "Challenge the Pin",
        "hint": "Break the pin and prepare to castle.",
        "hint_fa": "آچمز را بشکنید و برای قلعه آماده شوید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Development", "theme_fa": "گسترش",
        "turn": "black"
    },
    {
        "id": "daily_44",
        "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/P1NP1N2/1PP2PPP/R1BQK2R b KQkq - 0 5",
        "solution": ["a6"],
        "solution_uci": ["a7a6"],
        "title": "Prophylaxis",
        "hint": "Take control of b5 square.",
        "hint_fa": "کنترل خانه b5 را به دست بگیرید.",
        "difficulty": "Beginner", "difficulty_fa": "مبتدی",
        "theme": "Strategy", "theme_fa": "استراتژی",
        "turn": "black"
    },
    {
        "id": "daily_45",
        "fen": "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
        "solution": ["gxh3"],
        "solution_uci": ["g2h3"],
        "title": "Calculated Capture",
        "hint": "The h3 pawn is a menace. Deal with it logically.",
        "hint_fa": "پیاده h3 یک تهدید است. منطقی با آن برخورد کنید.",
        "difficulty": "Grandmaster", "difficulty_fa": "استاد بزرگ",
        "theme": "Strategy", "theme_fa": "استراتژی",
        "turn": "white"
    },
    {
        "id": "daily_46",
        "fen": "8/5p2/p2p1p1p/Pk1Pp1pP/1pP1P1P1/1K3P2/8/8 b - - 0 1",
        "solution": ["Kxc4"],
        "solution_uci": ["b5c4"],
        "title": "Endgame Precision",
        "hint": "One wrong step and the game is lost.",
        "hint_fa": "یک قدم اشتباه و بازی باخته است.",
        "difficulty": "Elite", "difficulty_fa": "نخبه",
        "theme": "Endgame", "theme_fa": "آخر بازی",
        "turn": "black"
    },
    {
        "id": "daily_47",
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p1N1/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 5 4",
        "solution": ["d5"],
        "solution_uci": ["d7d5"],
        "title": "Counterattack",
        "hint": "Meet the attack with a strike in the center.",
        "hint_fa": "حمله را با ضربه‌ای در مرکز پاسخ دهید.",
        "difficulty": "Advanced", "difficulty_fa": "پیشرفته",
        "theme": "Opening", "theme_fa": "گشایش",
        "turn": "black"
    },
    {
        "id": "daily_48",
        "fen": "rnbqkb1r/pp3ppp/3p1n2/2p1p3/3PP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 5",
        "solution": ["dxe5"],
        "solution_uci": ["d4e5"],
        "title": "Simplification",
        "hint": "Exchange to clarify the center.",
        "hint_fa": "تعویض کنید تا وضعیت مرکز شفاف شود.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Strategy", "theme_fa": "استراتژی",
        "turn": "white"
    },
    {
        "id": "daily_49",
        "fen": "r1b1k2r/ppppqppp/2n5/2b1P1N1/2B1P3/2N5/PPP2PPP/R1BQK2R b KQkq - 4 7",
        "solution": ["O-O"],
        "solution_uci": ["e8g8"],
        "title": "Escape the Pressure",
        "hint": "Hide your king while white is overextended.",
        "hint_fa": "در حالی که سفید بیش از حد پیش رفته، شاه خود را پنهان کنید.",
        "difficulty": "Advanced", "difficulty_fa": "پیشرفته",
        "theme": "Defense", "theme_fa": "دفاع",
        "turn": "black"
    },
    {
        "id": "daily_50",
        "fen": "rnbqkb1r/pp3ppp/2pp1n2/4p3/3PP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 5",
        "solution": ["d5"],
        "solution_uci": ["d4d5"],
        "title": "Closing the Center",
        "hint": "Cramp the position and prepare kingside plans.",
        "hint_fa": "وضعیت را تنگ کنید و برای نقشه‌های جناح شاه آماده شوید.",
        "difficulty": "Intermediate", "difficulty_fa": "متوسط",
        "theme": "Strategy", "theme_fa": "استراتژی",
        "turn": "white"
    },
]


def get_daily_puzzle() -> dict:
    """
    Returns the puzzle of the day. Uses the current date to deterministically
    pick one puzzle from the collection, so it stays the same all day.
    """
    today = date.today().isoformat()  # e.g. "2026-04-10"
    # Use a hash to get a deterministic but seemingly-random index
    hash_val = int(hashlib.md5(today.encode()).hexdigest(), 16)
    index = hash_val % len(PUZZLE_COLLECTION)
    puzzle = PUZZLE_COLLECTION[index].copy()
    puzzle["date"] = today
    return puzzle
