import { pip } from "../ext/pip.ts"

const
	np = await pip.import("numpy"),
	plt = await pip.import("matplotlib", "matplotlib.pyplot"),
	xpoints = np.array([1, 8]),
	ypoints = np.array([3, 10])

plt.plot(xpoints, ypoints)
plt.show()
