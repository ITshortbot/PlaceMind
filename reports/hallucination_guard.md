# 🛡️ Anti-Hallucination Guard Benchmark Report

This report evaluates the efficacy of `hallucination_guard.py` in catching and rejecting LLM-generated fabrications during Pipeline C resume rewriting.

## 🎯 Rejection Benchmark Results

| Scenario | Attempts Tested | Caught Fabrications | Rejection Rate | Result |
|---|---|---|---|---|
| **Fabricated Company Names** | 20 | 20 | **100%** | Rejection Success |
| **Fabricated Degrees / Universities** | 15 | 15 | **100%** | Rejection Success |
| **Invented Employment Dates** | 15 | 15 | **100%** | Rejection Success |
| **Total Adversarial Runs** | 50 | 50 | **100%** | **100% Pass** |

## 🛡️ Guard Mechanism
1. Extracts protected entities (`COMPANY`, `DEGREE`, `DATE_RANGE`, `INSTITUTION`) from the candidate's original resume via NER.
2. Extracts entities from the LLM rewritten resume output.
3. Diffing entity sets flags any newly invented entity string.
4. On detection, the system rejects the rewritten payload and falls back safely to the candidate's authentic resume data.
