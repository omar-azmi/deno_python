/** this submodule contains utility functions.
 *
 * @module
*/

import { currentOs, textEncoder } from "./deps.ts"


const libdl_def = {
	dlopen: {
		parameters: ["buffer", "i32"],
		result: "pointer",
	},
} as const

/** on unix-based systems, we need to supply dlopen with `RTLD_GLOBAL`, but `Deno.dlopen` does not support passing that flag.
 *
 * so we open up libc and use its `dlopen` to promote the {@link lib} with the `RTLD_LAZY | RTLD_GLOBAL` flags,
 * which would allow subsequently loaded shared libraries (from within {@link lib}) to be able to use symbols from python's c-abi.
*/
export const promoteDynamicLib = (lib: string): void => {
	// TODO: investigate the `RTLD_NOLOAD`, and if it will be needed to ensure that the python dl is not reloaded under any circumstance.
	// the issue I see there is that when using `RTLD_NOLOAD`, it only matches with the full resolved path of the dl,
	// and search aliases, like `"python3.15.so"` will fail this; it'll need to be explicit like `"/usr/local/lib/python3.15.so"`.
	let
		libdl: Deno.DynamicLibrary<typeof libdl_def> | undefined = undefined,
		RTLD_LAZY: number | undefined = undefined,
		RTLD_GLOBAL: number | undefined = undefined

	switch (currentOs) {
		case "android":
		case "linux":
		case "freebsd":
		case "openbsd": {
			const
				libc = Deno.dlopen("libc.so.6", {
					gnu_get_libc_version: { parameters: [], result: "pointer" },
				}),
				ptr_view = new Deno.UnsafePointerView(libc.symbols.gnu_get_libc_version()!),
				glibc_version = parseFloat(ptr_view.getCString()),
				// starting with `glibc v2.34`, `libdl` is merged into `libc`.
				libdl_path = glibc_version >= 2.34 ? "libc.so.6" : "libdl.so.2"
			libdl = Deno.dlopen(libdl_path, libdl_def)
			RTLD_LAZY = 0x0001
			RTLD_GLOBAL = 0x0100
			break
		}
		case "darwin": {
			libdl = Deno.dlopen("/usr/lib/libSystem.B.dylib", libdl_def)
			RTLD_LAZY = 0x0001
			RTLD_GLOBAL = 0x0008
			break
		}
		default: {
			break
		}
	}

	libdl?.symbols.dlopen(cstr(lib), RTLD_LAZY! | RTLD_GLOBAL!)
}

/** encodes a string into a utf-8 compatible c-string. */
export const cstr = (str: string): Uint8Array<ArrayBuffer> => {
	return textEncoder.encode(str + "\x00")
}

/** regular expression that tests if a string is a _proper python slice_;
 * based on: [docs.python.org](https://docs.python.org/3/reference/expressions.html#slicings)
*/
export const SliceItemRegExp = /^\s*(-?\d+)?\s*:\s*(-?\d+)?\s*(:\s*(-?\d+)?\s*)?$/
