.PHONY: test
test:
	deno test --allow-read --coverage=.coverage
	deno coverage .coverage --lcov > lcov.info

.PHONY: snapshot
snapshot:
	deno test --allow-read -- --update

.PHONY: check
check:
	deno fmt
	deno lint

.PHONY: readme
readme:
	deno run --allow-run --allow-read=examples scripts/readme.ts > README.md
