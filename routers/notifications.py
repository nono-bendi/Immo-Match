import sqlite3
from datetime import datetime
from fastapi import APIRouter

from config import DB_PATH

router = APIRouter()


@router.get("/notifications")
def get_notifications():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    notifications = conn.execute('''
        SELECT * FROM notifications
        ORDER BY created_at DESC
        LIMIT 20
    ''').fetchall()

    unread_count = conn.execute('SELECT COUNT(*) FROM notifications WHERE is_read = 0').fetchone()[0]

    conn.close()

    return {
        "notifications": [dict(n) for n in notifications],
        "unread_count": unread_count
    }


@router.post("/notifications/mark-read")
def mark_notifications_read():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('UPDATE notifications SET is_read = 1 WHERE is_read = 0')
    conn.commit()
    conn.close()
    return {"success": True}


@router.post("/notifications/add")
def add_notification(notif: dict):
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        INSERT INTO notifications (type, title, message, link, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        notif.get('type'),
        notif.get('title'),
        notif.get('message'),
        notif.get('link'),
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    return {"success": True}


@router.delete("/notifications/clear")
def clear_notifications():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('DELETE FROM notifications')
    conn.commit()
    conn.close()
    return {"success": True}
