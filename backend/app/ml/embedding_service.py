from sentence_transformers import SentenceTransformer
import redis
import hashlib
import json
import os
import numpy as np
from typing import List

class EmbeddingService:
    def __init__(self, model_name: str = "BAAI/bge-large-en-v1.5"):
        # SentenceTransformer automatically uses MPS on Mac if available
        self.model = SentenceTransformer(model_name)
        self.redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))

    def _hash_text(self, text: str) -> str:
        return hashlib.sha256(text.encode('utf-8')).hexdigest()

    def embed_texts(self, texts: List[str]) -> List[np.ndarray]:
        if not texts:
            return []
            
        embeddings = []
        texts_to_embed = []
        indices_to_embed = []
        
        for i, text in enumerate(texts):
            h = self._hash_text(text)
            cached = self.redis_client.get(f"embed:{h}")
            if cached:
                embeddings.append(np.array(json.loads(cached)))
            else:
                embeddings.append(None) # placeholder
                texts_to_embed.append(text)
                indices_to_embed.append(i)
                
        if texts_to_embed:
            # Generate missing embeddings
            new_embeddings = self.model.encode(texts_to_embed, normalize_embeddings=True)
            for i, emb in zip(indices_to_embed, new_embeddings):
                embeddings[i] = emb
                h = self._hash_text(texts[i])
                self.redis_client.setex(f"embed:{h}", 86400 * 30, json.dumps(emb.tolist())) # Cache for 30 days
                
        return embeddings

embedding_service = EmbeddingService()
