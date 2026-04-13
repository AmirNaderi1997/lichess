import chess
import time as _time


class ChessGame:
    def __init__(self, room_id=None, time_control="10+0"):
        self.room_id        = room_id
        self.board          = chess.Board()
        self.players        = {"white": None, "black": None}
        self.spectators     = []
        
        # Parse time control (e.g. "1+0" -> 60s, "10+5" -> 600s)
        try:
            mins, increment = map(int, time_control.split("+"))
            initial_seconds = mins * 60
            self.time_left = {"white": initial_seconds, "black": initial_seconds}
            self.increment = increment
        except:
            self.time_left = {"white": 600, "black": 600}
            self.increment = 0

        self.last_move_time = None
        self.is_ready       = False
        self.is_started     = False

    def start(self):
        if self.is_ready and not self.is_started:
            self.is_started = True
            self.last_move_time = _time.time()
            return True
        return False

    def make_move(self, move_uci: str):
        if not self.is_ready:
            return False, "Waiting for opponent"

        now = _time.time()

        # First move: just start the clock, don't deduct yet
        if not self.is_started:
            self.is_started     = True
            self.last_move_time = now
        else:
            # Deduct elapsed time from the player whose turn it WAS
            # (board.turn is still the old turn before push)
            elapsed = now - self.last_move_time
            turn    = "white" if self.board.turn == chess.WHITE else "black"
            self.time_left[turn] = max(0.0, self.time_left[turn] - elapsed)
            self.last_move_time  = now

        try:
            move = chess.Move.from_uci(move_uci)
        except Exception as e:
            return False, f"Invalid UCI format: {e}"

        if move not in self.board.legal_moves:
            return False, "Illegal move"

        self.board.push(move)
        return True, self.get_state()

    # ──────────────────────────────────────────
    def get_state(self):
        return {
            "fen":                    self.board.fen(),
            "is_checkmate":           self.board.is_checkmate(),
            "is_stalemate":           self.board.is_stalemate(),
            "is_insufficient_material": self.board.is_insufficient_material(),
            "is_game_over":           self.board.is_game_over(),
            "turn":                   "white" if self.board.turn == chess.WHITE else "black",
            "last_move":              self.board.peek().uci() if self.board.move_stack else None,
            "time_left":              self.time_left,
            "is_ready":               self.is_ready,
            "is_started":             self.is_started,
        }

    # ──────────────────────────────────────────
    def reset(self):
        self.board          = chess.Board()
        self.time_left      = {"white": 600, "black": 600}
        self.last_move_time = None
        self.is_started     = False
        return self.get_state()
