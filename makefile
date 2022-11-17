.PHONY: test
test:
	deno test -A --unstable

.PHONY: check
check:
	deno fmt
	deno lint --unstable

.PHONY: readme
readme:
	deno run --allow-run --allow-read=examples scripts/readme.ts > README.md
