import math
import table_annotator.lm


def test_language_model() -> None:
    texts = ["abcd", "Ac", "adb"]
    language_model = table_annotator.lm.make_language_model(texts)

    test_texts = ["ab", "ac", "bd", "e"]
    perplexities = table_annotator.lm.perplexity(language_model, test_texts)

    assert not math.isinf(perplexities[0])
    assert not math.isinf(perplexities[1])
    assert math.isinf(perplexities[2])
    assert math.isinf(perplexities[3])