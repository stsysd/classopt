test:
	deno test -A --unstable

check:
	deno fmt
	deno lint --unstable

readme:
	deno run --allow-run --allow-read=examples scripts/readme.ts > README.md
