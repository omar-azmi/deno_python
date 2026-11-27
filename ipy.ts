import py, { type Python } from "./src/mod.ts"
import { type Pip, pip } from "./ext/pip.ts"

declare global {
	const py: Python
	const pip: Pip
}

Object.defineProperty(globalThis, "py", {
	value: py,
	writable: false,
	enumerable: false,
	configurable: false,
})

Object.defineProperty(globalThis, "pip", {
	value: pip,
	writable: false,
	enumerable: false,
	configurable: false,
})

export * from "./src/mod.ts"
export * from "./ext/pip.ts"
export default py
