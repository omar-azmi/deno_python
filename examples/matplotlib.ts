import { python } from "../src/mod.ts"

const
	np = python.import("numpy"),
	plt = python.import("matplotlib.pyplot"),
	xpoints = np.array([1, 8]),
	ypoints = np.array([3, 10])

plt.plot(xpoints, ypoints)
plt.show()
