#!/bin/bash

source ~/.functions  # Load custom functions

# Auto-resume Claude CLI task with live output, retry, and done detection

DEFAULT_PROMPT="continue pending tasks from previous session, fix build issues, don't wait for user input at any time, then fetch the new list of pending tasks from \"Tasks/todos.md\" and continue working on them. Once they are done, pick the next set of tasks. Don't stop until every task and bug are completed."
USE_CONTINUE_FLAG=true
FALLBACK_WAIT_SECONDS=300  # Default wait time if timestamp is invalid

# Timestamped logger
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $*"
    telegram "$*"  # Send log to Telegram
}

show_help() {
    cat << EOF
Usage: claude-auto-resume [OPTIONS] [PROMPT]

Automatically resume Claude CLI tasks after usage limits are lifted.
Streams output, retries on limit, and exits when Claude indicates completion.

OPTIONS:
  -p, --prompt PROMPT     Custom prompt
  -c, --continue          Continue previous Claude conversation
  -h, --help              Show this help message
EOF
}

CUSTOM_PROMPT="$DEFAULT_PROMPT"

# Parse flags
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--prompt)
            CUSTOM_PROMPT="$2"
            shift 2
            ;;
        -c|--continue)
            USE_CONTINUE_FLAG=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            log "[ERROR] Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            CUSTOM_PROMPT="$1"
            shift
            ;;
    esac
done

run_claude() {
    if [ "$USE_CONTINUE_FLAG" = true ]; then
        claude -c --dangerously-skip-permissions -p "$CUSTOM_PROMPT" 2>&1 | tee /tmp/claude_output.log
    else
        claude --dangerously-skip-permissions -p "$CUSTOM_PROMPT" 2>&1 | tee /tmp/claude_output.log
    fi
    return ${PIPESTATUS[0]}
}

format_hms() {
    printf '%02dh %02dm %02ds' $(( $1 / 3600 )) $(( ($1 % 3600) / 60 )) $(( $1 % 60 ))
}

# Retry loop
while true; do
    printf "\n"

    log "⚙️  Running Claude task with prompt: '$CUSTOM_PROMPT'"
    printf "\n"
    run_claude
    RET_CODE=$?
    OUTPUT=$(cat /tmp/claude_output.log)

    # Check for usage limit
    if echo "$OUTPUT" | grep -q "Claude AI usage limit reached"; then
        RESUME_TIMESTAMP=$(echo "$OUTPUT" | awk -F'|' '{print $2}')
        NOW=$(date +%s)

        printf "\n"
        if [[ "$RESUME_TIMESTAMP" =~ ^[0-9]+$ ]] && [ "$RESUME_TIMESTAMP" -gt "$NOW" ]; then
            WAIT=$((RESUME_TIMESTAMP - NOW))
            RESUME_HUMAN_TIME=$(date -d "@$RESUME_TIMESTAMP" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -r "$RESUME_TIMESTAMP" '+%Y-%m-%d %H:%M:%S')
            log "🛑 Usage limit hit. Waiting for $(format_hms $WAIT) (until $RESUME_HUMAN_TIME local time)."
        else
            WAIT=$FALLBACK_WAIT_SECONDS
        fi

        printf "\n"

        while [ $WAIT -gt 0 ]; do
            printf "\r⏳ Resuming in $(format_hms $WAIT)..."
            sleep 1
            NOW=$(date +%s)
            WAIT=$((RESUME_TIMESTAMP - NOW))

            if [ $WAIT -lt 0 ]; then 
                WAIT=0; 
            fi
        done
        printf "\n"
        log "🔄 Resuming Claude execution..."
        sleep 3

    # Check for CLI failure
    elif [ $RET_CODE -ne 0 ]; then
        log "[ERROR] Claude CLI failed. Output above."
        sleep 10
        continue  # Don’t exit — try again in next loop

    # # Claude says all done
    # elif echo "$OUTPUT" | grep -iqE "all tasks completed|nothing else|done|everything is finished"; then
    #     log "🎉 Claude indicates all tasks are complete. Exiting."
    #     exit 0

    # Success path
    else
        log "✅ Claude task completed."

        # # ── Checkpoint: fix build issues ──
        # log "📍 Running checkpoint prompt"
        # run_claude "Implement TODO/FIXMEs in the code, fix build issues, ensure the app starts and runs without issues";
        # RET_CODE=$?
        # if [ $RET_CODE -e 0 ]; then
        #     log "✅ Checkpoint completed."

        #     # Git commit after checkpoint
        #     log "📦 Staging changes for git commit..."
        #     git add .

        #     if git diff --cached --quiet; then
        #         log "ℹ️  No changes to commit."
        #     else
        #         git commit -m "auto: apply fixes"
        #         git push origin HEAD > /dev/null 2>&1
        #         log "✅ Committed changes and pushed to origin."
        #     fi
        # else
        #     log "[ERROR] Checkpoint task failed. Check /tmp/claude_checkpoint_output.log"
        #     sleep 10
        #     continue
        # fi

        log "⏳ Waiting 5 seconds before next iteration..."
        sleep 5
    fi
done
