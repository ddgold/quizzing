import re


def __sanitizeString(input):
    clean = re.sub(pattern=r"[\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+\'\"]", repl=" ", string=input)
    cleaner = re.sub(pattern=r"\s{2,}", repl=" ", string=clean)
    return cleaner.strip().lower()


def evaluate(answer, guess):
    return __sanitizeString(answer) == __sanitizeString(guess)
