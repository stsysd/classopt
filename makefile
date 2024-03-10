.PHONY: test
test:
	deno test -A --coverage=.coverage
	deno coverage .coverage --lcov > lcov.info

snapshot-update:
	deno test -A -- --update

.PHONY: check
check:
	deno fmt
	deno lint

.PHONY: readme
readme:
	deno run --allow-run --allow-read scripts/readme.ts > README.md
