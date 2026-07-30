#!/bin/bash
# Deploiement automatique du blog (et de tout changement sur main en general).
# Execute periodiquement par cron sur le VPS. Ne fait JAMAIS d'operation
# destructive (pas de stash, reset --hard, checkout -- ou clean) : si le pull
# n'est pas un fast-forward propre, on abandonne et on log, un humain
# tranchera. Voir landing/BLOG_AUTOMATION.md pour le contexte complet.

set -u
cd /app || { echo "$(date -Is) ERREUR: /app introuvable"; exit 1; }

LOG=/var/log/immo-blog-deploy.log
log() { echo "$(date -Is) $1" >> "$LOG"; }

git fetch origin main --quiet 2>>"$LOG"
if [ $? -ne 0 ]; then
    log "ERREUR: git fetch a echoue"
    exit 1
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    exit 0
fi

# Working tree sale => quelqu'un a modifie des fichiers directement sur le
# VPS (deploiement manuel, hotfix). On ne touche a rien, on log et on sort.
if [ -n "$(git status --porcelain)" ]; then
    log "ABANDON: working tree modifie localement, pull non tente. Fichiers concernes:"
    git status --porcelain >> "$LOG"
    exit 1
fi

# Redemarrage du backend seulement si des fichiers backend sont dans les
# commits a tirer (le blog seul, via landing/dist, ne le necessite jamais
# grace au sitemap dynamique de routers/seo.py).
NEED_RESTART=0
if git diff --name-only "$LOCAL" "$REMOTE" | grep -qE '^(routers/|backend\.py|config\.py)'; then
    NEED_RESTART=1
fi

if ! git pull --ff-only origin main >> "$LOG" 2>&1; then
    log "ERREUR: git pull --ff-only a echoue (pas un fast-forward propre). Abandon, aucune modification appliquee."
    exit 1
fi

log "OK: pull reussi $LOCAL -> $REMOTE"

if [ "$NEED_RESTART" = "1" ]; then
    systemctl restart immo-match
    sleep 2
    if systemctl is-active --quiet immo-match; then
        log "immo-match redemarre (fichiers backend modifies) - actif"
    else
        log "ERREUR CRITIQUE: immo-match ne redemarre pas correctement apres pull"
    fi
fi
