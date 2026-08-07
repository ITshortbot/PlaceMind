from sentence_transformers import SentenceTransformer
from typing import List

class EmbeddingService:
    def __init__(self, model_name: str = "BAAI/bge-large-en-v1.5"):
        """
        Loads the embedding model. Default is BAAI/bge-large-en-v1.5 as per the spec,
        which outputs 1024-dimensional vectors.
        """
        try:
            self.model = SentenceTransformer(model_name)
            self.is_ready = True
        except Exception as e:
            print(f"Error loading embedding model: {e}")
            self.is_ready = False

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Embeds a list of text chunks.
        """
        if not self.is_ready:
            raise RuntimeError("Embedding model is not properly loaded.")
            
        embeddings = self.model.encode(texts, normalize_embeddings=True)
        return embeddings.tolist()
        
    def embed_text(self, text: str) -> List[float]:
        return self.embed_texts([text])[0]
