from celery import Celery
import os

celery_app = Celery(
    "placemind",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0")
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Autodiscover tasks in our modules
celery_app.autodiscover_tasks(["app.tasks.debug", "app.tasks.parsing", "app.tasks.scoring", "app.tasks.generation"])
