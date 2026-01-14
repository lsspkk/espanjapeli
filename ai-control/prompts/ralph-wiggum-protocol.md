# Ralph Wiggum Protocol

Simple work protocol for AI agents. One subtask at a time.

## Protocol Definition

Allowed log line formats for progress.txt:

```
HH:MM - Started Task X.Y 
HH:MM - [Iteration N] Task X.Y complete
HH:MM - Started Subtask X.Y 
HH:MM - [Iteration N] Subtask X.Y complete
HH:MM - Created §filenames
HH:MM - Updated §filenames
HH:MM - Tests pass §test_filename
HH:MM - Tests fail §test_filename
HH:MM - Installed package_name
```


## Startup

1. Read `ai-control/PRINCIPLES.md` - coding standards
2. Read `ai-control/ROADMAP.md` - project context
3. Read `ai-control/todo.json` - pick subtask with status "not-started"
4. Read `progress.txt` - see what's been done
5. Update subtask status to "in-progress" in todo.json

## Work

- Work on ONE subtask only
- Task NOT complete until tests pass (check testRequired field)
- Python scripts → `scripts/` folder, use project venv
- Svelte code → follow PRINCIPLES.md
- Git commit when subtask done

## Communication

SHORT SENTENCES:
- Planning... Coding... Testing... Fixing... Done.

DO NOT work silently. Output progress.


## Completion

1. Mark subtask "completed" in todo.json
2. Write to progress.txt (include iteration number if provided)
3. Run `npm test` in svelte/ if code changed
4. Check todo.json for remaining work:
   - If ANY task/subtask has status 'not-started' → END response (loop continues)
   - ONLY if ALL tasks AND subtasks are 'completed' → Output: `<promise>COMPLETE</promise>`

## Example (more work remains)

```
[Iteration 2 of 10]

Planning...
Read todo.json, selected Task 1.3

Coding...
Created scripts/data_pipeline/download_frequency.py

Testing...
pytest scripts/data_pipeline/test_frequency.py
Tests pass.

Marked 1.3 completed in todo.json
Logged to progress.txt

Done. More tasks remain, ending iteration.
```

## Example (all work complete)

```
[Iteration 5 of 10]

Checked todo.json - all tasks and subtasks are 'completed'.
No more work to do.

<promise>COMPLETE</promise>
```
