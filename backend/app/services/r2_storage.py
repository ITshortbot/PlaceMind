# ============================================================================
# File: backend/app/services/r2_storage.py
# Description: Cloudflare R2 object storage client for encrypted resume PDF handling
# ============================================================================

import io
import logging
from typing import Optional
import boto3
from botocore.client import Config
from app.core.config import settings

logger = logging.getLogger("placemind.storage")

class R2StorageService:
    """
    S3-compatible async-friendly wrapper for Cloudflare R2.
    Cloudflare R2 features zero-egress fees, critical for cost-effective AI document storage.
    """

    def __init__(self):
        self.bucket_name = settings.R2_BUCKET_NAME
        self.is_configured = bool(
            settings.R2_ACCOUNT_ID and settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY
        )
        
        if self.is_configured:
            endpoint_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=endpoint_url,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4"),
                region_name="auto",
            )
        else:
            self.s3_client = None

    async def upload_pdf(self, file_bytes: bytes, file_key: str) -> Optional[str]:
        """
        Uploads PDF buffer to Cloudflare R2 bucket.
        Returns the CDN URL or None if storage is unconfigured / local mode.
        """
        if not self.is_configured or not self.s3_client:
            logger.info("Cloudflare R2 not configured. Operating in local memory mode.")
            return None

        try:
            self.s3_client.upload_fileobj(
                Fileobj=io.BytesIO(file_bytes),
                Bucket=self.bucket_name,
                Key=file_key,
                ExtraArgs={"ContentType": "application/pdf"},
            )
            return f"{settings.R2_PUBLIC_URL_PREFIX}/{file_key}"
        except Exception as e:
            logger.error(f"Failed to upload to Cloudflare R2: {str(e)}")
            return None

r2_storage = R2StorageService()
