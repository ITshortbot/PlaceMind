#!/usr/bin/env bash
# T-006: Local model runtime setup (Ollama)
echo "Pulling required models for PlaceMind..."
ollama pull qwen2.5:7b-instruct-q4_K_M
ollama pull deepseek-r1-distill-llama:8b-q4_K_M
echo "Models pulled successfully."
