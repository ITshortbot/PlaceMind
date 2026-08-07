from ..worker import celery_app

@celery_app.task(name="ping")
def ping_task(message: str = "pong") -> str:
    return f"Celery ping received: {message}"
