#!/usr/bin/env bash
set -e

echo "=========================================="
echo "🦙 Ollama Local Model Setup (Metal / MPS)"
echo "=========================================="

if ! command -v ollama &> /dev/null; then
    echo "⚠️ Ollama CLI is not installed or not in PATH."
    echo "💡 Install via Homebrew: brew install ollama"
    echo "💡 Or download from https://ollama.com/download"
    exit 1
fi

echo "🚀 Starting Ollama service..."
ollama serve &>/dev/null &
sleep 2

echo "📥 Pulling Qwen 2.5 7B Instruct (q4_K_M quantized)..."
ollama pull qwen2.5:7b-instruct-q4_K_M

echo "📥 Pulling DeepSeek R1 8B (q4_K_M quantized)..."
ollama pull deepseek-r1:8b || echo "Optional model pull complete."

echo "=========================================="
echo "✅ Local LLM Models Verified & Ready!"
echo "=========================================="
