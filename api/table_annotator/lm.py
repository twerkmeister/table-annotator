from typing import Text, List

from nltk.lm.preprocessing import padded_everygram_pipeline, padded_everygrams
from nltk.lm import MLE


def make_language_model(texts: List[Text], order=2) -> MLE:
    """Create and Fit a language model to the given texts."""
    lower_texts = [text.lower() for text in texts]
    train, vocab = padded_everygram_pipeline(order, lower_texts)
    lm = MLE(order)
    lm.fit(train, vocab)
    return lm


def perplexity(lm: MLE, texts: List[Text]) -> List[float]:
    """Uses the given language model to calculate the perplexity on the texts."""
    return [lm.perplexity(padded_everygrams(2, text.lower()))
            for text in texts]
