import boto3
import os
from botocore.exceptions import ClientError
from typing import Optional

class ObjectStore:
    def __init__(self):
        self.endpoint_url = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
        self.access_key = os.getenv("MINIO_ROOT_USER", "minioadmin")
        self.secret_key = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
        self.bucket_name = os.getenv("MINIO_BUCKET_NAME", "placemind-resumes")

        self.s3_client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name="us-east-1"
        )
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            self.s3_client.create_bucket(Bucket=self.bucket_name)

    def upload_file(self, file_path: str, object_name: str) -> bool:
        """
        Uploads a file to the S3 bucket.
        """
        try:
            self.s3_client.upload_file(file_path, self.bucket_name, object_name)
            return True
        except ClientError as e:
            print(f"Failed to upload {file_path}: {e}")
            return False

    def get_presigned_url(self, object_name: str, expiration=3600) -> Optional[str]:
        """
        Generate a presigned URL to share an S3 object.
        """
        try:
            response = self.s3_client.generate_presigned_url('get_object',
                                                             Params={'Bucket': self.bucket_name,
                                                                     'Key': object_name},
                                                             ExpiresIn=expiration)
            return response
        except ClientError as e:
            print(f"Failed to generate presigned URL: {e}")
            return None

    def delete_file(self, object_name: str) -> bool:
        """
        Deletes a file from the S3 bucket.
        """
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_name)
            return True
        except ClientError as e:
            print(f"Failed to delete {object_name}: {e}")
            return False

object_store = ObjectStore()
