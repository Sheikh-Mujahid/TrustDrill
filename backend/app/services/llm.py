from typing import Optional


class LLMProvider:
    """Optional LLM abstraction. Never required for core functions. No secrets in code."""

    def summarize(self, text: str) -> Optional[str]:
        return None


def get_llm_provider(name: str, api_key: str, model: str) -> LLMProvider:
    if not name or not api_key:
        return LLMProvider()
    return LLMProvider()
