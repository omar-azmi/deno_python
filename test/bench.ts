import { bench, run } from "mitata"
import { python } from "../src/mod.ts"


const { add } = python.runModule(`
def add(a, b):
	return a + b
`)

bench("noop", () => { })

bench("python.add", () => {
	add(1, 2)
})

await run()
