"""
Configuration du logging centralisé pour ImmoMatch.
Niveaux : DEBUG < INFO < WARNING < ERROR < CRITICAL
"""
import logging
import sys

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger  # Déjà configuré

    logger.setLevel(logging.DEBUG)

    # Format lisible avec timestamp, niveau et module
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)-8s] %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console (stdout)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger
