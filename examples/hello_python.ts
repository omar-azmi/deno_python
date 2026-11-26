import { python } from "../mod.ts"

const
	{ print, str } = python.builtins,
	{ version } = python.import("sys")

print(str("Hello, World!").lower())
print("Python version:", version)
