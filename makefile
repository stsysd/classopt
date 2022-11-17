.PHONY: test
test:
	deno test --coverage=.coverage
	deno coverage .coverage --lcov > lcov.info

.PHONY: check
check:
	deno fmt
	deno lint --unstable

.PHONY: readme
readme:
	deno run --allow-run --allow-read=examples scripts/readme.ts > README.md
