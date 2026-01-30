class CustomFunctionManager {
    constructor(formula) {
        this.formula = formula
        this.func    = this.createFunctionFromString(formula)
    }

    createFunctionFromString(formula) {
        try {
            if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(formula)) {
                try {
                    if (typeof window !== 'undefined' && typeof window[formula] === 'function') {
                        const fn = window[formula]
                        return function(x, y, time) {
                            try {
                                const res = fn(x, y, time)
                                if (res && typeof res.abs === 'function') return res.abs()
                                return Number(res) || 0
                            } catch (e) { return 0; }
                        }
                    }
                } catch (e) {}
            }

            let transformed = ParserUtils.transform(formula)

            const body = `
                try {
                    const z = new Complex(x, y)
                    const i = new Complex(0, 1)
                    const t = time
                    const __toC = (v) => (v instanceof Complex) ? v : (typeof v === 'number' ? new Complex(v,0) : v)
                    const __mul = (a,b) => {
                        if (a instanceof Complex || b instanceof Complex) return __toC(a).mul(__toC(b))
                        return a * b
                    }
                    const __div = (a,b) => {
                        if (a instanceof Complex || b instanceof Complex) return __toC(a).div(__toC(b))
                        return a / b
                    }
                    const __add = (a,b) => {
                        if (a instanceof Complex || b instanceof Complex) return __toC(a).add(__toC(b))
                        return a + b
                    }
                    const __sub = (a,b) => {
                        if (a instanceof Complex || b instanceof Complex) return __toC(a).sub(__toC(b))
                        return a - b
                    }
                    const __pow = (a,b) => {
                        return __toC(a).pow(__toC(b))
                    }

                    const _expr = ` + JSON.stringify(transformed) + `
                    const _res = (function(){ return eval(_expr); })()
                    if (_res && typeof _res.abs === 'function') return _res.abs()
                    const _num = Number(_res)
                    return isFinite(_num) ? _num : 0
                } catch (e) {
                    console.error('Error evaluating custom function:', e)
                    return 0
                }
            `

            console.info('Creating custom function from formula:', formula, 'transformed:', transformed)
            const generated = new Function('x', 'y', 'time', body)

            return function(x, y, time) {
                try {
                    return generated(x, y, time)
                } catch (e) {
                    try {
                        const altBody = `
                            try {
                                const z = new Complex(x, y)
                                const i = new Complex(0, 1)
                                const t = time
                                const __toC = (v) => (v instanceof Complex) ? v : (typeof v === 'number' ? new Complex(v,0) : v)
                                const __mul = (a,b) => { if (a instanceof Complex || b instanceof Complex) return __toC(a).mul(__toC(b)); return a * b; }
                                const __div = (a,b) => { if (a instanceof Complex || b instanceof Complex) return __toC(a).div(__toC(b)); return a / b; }
                                const __add = (a,b) => { if (a instanceof Complex || b instanceof Complex) return __toC(a).add(__toC(b)); return a + b; }
                                const __sub = (a,b) => { if (a instanceof Complex || b instanceof Complex) return __toC(a).sub(__toC(b)); return a - b; }
                                const __pow = (a,b) => { return __toC(a).pow(__toC(b)); }
                                const _expr = ` + JSON.stringify(transformed) + `
                                const _res = (function(){ return eval(_expr); })()
                                return _res
                            } catch (e) { throw e; }
                        `
                        const alt   = new Function('x','y','time', altBody)
                        const _res  = alt(x, y, time)
                        if (_res && typeof _res.abs === 'function') return _res.abs()
                        const _num  = Number(_res)

                        return isFinite(_num) ? _num : 0
                    } catch (e2) {
                        return 0
                    }
                }
            }
        } catch (e) {
            console.error("Error creating function:", e)
            return (x, y, time) => 0
        }
    }
}

const PRESET_FUNCTIONS = [
    { name: "Sine Wave",                    formula: "10 + 10 * Math.sin(0.005 * (x * x + y * y) - time)" },
    { name: "Cosine Ring",                  formula: "20 * Math.cos(0.2 * Math.sqrt(x*x + y*y) - time)" },
    { name: "Hyperbolic Paraboloid",        formula: "x * y / 100" },
    { name: "Cone",                         formula: "30 - Math.sqrt(x*x + y*y)" },
    { name: "Stairs",                       formula: "(Math.round(x/10) + Math.round(y/10)) * 5" },
    { name: "Tilted Plane",                 formula: "x/2 + y/3" },
    { name: "Paraboloid",                   formula: "0.1 * (x*x + y*y) - 20" },
    { name: "Egg Carton",                   formula: "10 * (Math.sin(x/10) + Math.cos(y/10))" },
    { name: "Volcano",                      formula: "40 / (1 + 0.01 * (x*x + y*y)) - 20" },
    { name: "Saddle",                       formula: "0.1 * (x*x - y*y)" },
    { name: "Wavy Grid",                    formula: "Math.sin(x/5) * Math.cos(y/5) * 15" },
    { name: "Gaussian",                     formula: "30 * Math.exp(-(x*x + y*y)/200)" },
    { name: "Concentric Circles",           formula: "Math.sin(Math.sqrt(x*x+y*y)/5) * 10" },
    { name: "Sharp Peaks",                  formula: "Math.max(0, 20 - Math.abs(x) - Math.abs(y))" },
    { name: "Exponential Decay",            formula: "50 * Math.exp(-Math.sqrt(x*x+y*y)/20)" },
    { name: "Interference",                 formula: "Math.sin(x/8) + Math.cos(y/8) * 10" },
    { name: "Checkerboard",                 formula: "((Math.floor(x/10) % 2) === (Math.floor(y/10) % 2)) ? 10 : 0" },
    { name: "Spiral Ramp",                  formula: "0.5 * Math.sqrt(x*x + y*y) + 5 * Math.sin(0.1 * Math.atan2(y, x) - time)" },
    { name: "Moving Hills",                 formula: "15 * Math.sin(0.1 * x + 0.1 * y - time) * Math.cos(0.1 * x - 0.1 * y - time)" },
    { name: "Pulsating Dome",               formula: "30 * Math.exp(-(x*x + y*y)/300) * (1 + 0.5 * Math.sin(time))" },
    { name: "Twisted Plane",                formula: "0.1 * (x * Math.cos(0.1 * y) + y * Math.sin(0.1 * x))" },
    { name: "Moving Sin Stairs",            formula: "5 * (Math.round(x/10 + Math.sin(time)) + Math.round(y/10 + Math.cos(time)))" },
    { name: "Dynamic Waves",                formula: "10 * Math.sin(0.2 * x + time) * Math.cos(0.2 * y + time)" },
    { name: "Rotating Peaks",               formula: "20 * Math.sin(0.1 * Math.sqrt(x*x + y*y) - time) / (1 + 0.01 * (x*x + y*y))" },
    { name: "Breathing Saddle",             formula: "0.1 * (x*x - y*y) * (1 + 0.3 * Math.sin(time))" },
    { name: "Oscillating Checkerboard",     formula: "((Math.floor(x/10 + Math.sin(time)) % 2) === (Math.floor(y/10 + Math.cos(time)) % 2)) ? 10 : 0" },
    { name: "Moving Volcanic Waves",        formula: "40 / (1 + 0.01 * (x*x + y*y)) - 20 + 5 * Math.sin(0.1 * Math.sqrt(x*x + y*y) - time)" },
    { name: "Weird Peaks and Valleys",      formula: "15 * Math.sin(0.1 * x) * Math.cos(0.1 * y) + 10 * Math.sin(0.2 * Math.sqrt(x*x + y*y) - time)" },
    { name: "Random Noise",                 formula: "10 * (Math.random() - 0.5)" },
    { name: "Perlin Noise",                 formula: "10 * noise.perlin2(x / 20, y / 20)" },
    { name: "Simplex Noise",                formula: "10 * noise.simplex2(x / 20, y / 20)" },
    { name: "Moving Simplex Noise",         formula: "10 * noise.simplex3(x / 20, y / 20, time / 10)" }
]

const PRESET_COMPLEX_FUNCTIONS = [
    { name: "Zeta",                         formula: "zeta" },
    { name: "Mandelbrot",                   formula: "mandelbrot" },
    { name: "Burning Ship",                 formula: "burningShip" },
    { name: "Julia Set",                    formula: "julia" },
    { name: "Square",                       formula: "z * z" },
    { name: "Cube",                         formula: "z * z * z" },
    { name: "Sine of z",                    formula: "new Complex(Math.sin(z.re) * Math.cosh(z.im), Math.cos(z.re) * Math.sinh(z.im))" },
    { name: "Castle Ramparts",              formula: "new Complex(Math.floor(z.re), Math.floor(z.im))" },
    { name: "Exponential",                  formula: "z.exp()" },
    { name: "Logarithm",                    formula: "z.log()" },
    { name: "Reciprocal",                   formula: "new Complex(1,0).div(z)" },
    { name: "Absolute Value",               formula: "new Complex(z.abs(), 0)" },
    { name: "Complex Sine Wave",            formula: "new Complex(10 + 10 * Math.sin(0.005 * (z.re * z.re + z.im * z.im) - time), 0)" },
    { name: "Animated Spiral (Amplitude)",  formula: "z.pow(new Complex(0.5, 0.5)).mul(new Complex(Math.cos(time/8), Math.sin(time/8))).mul(new Complex(1 + 0.7 * Math.sin(time/6), 0))" },
    { name: "Pulsating Exp",                formula: "z.exp().mul(new Complex(1 + 0.6 * Math.sin(time/7), 0))" },
    { name: "Mobius Twist",                 formula: "new Complex((z.re - 1) / (z.re + 1 + 1e-6), z.im)" },
    { name: "Log Ripple",                   formula: "new Complex(Math.log(z.abs() + 1) * Math.cos(z.re + time/10), Math.log(z.abs() + 1) * Math.sin(z.im + time/10))" },
    { name: "Complex Gaussian",             formula: "new Complex(30 * Math.exp(-(z.re * z.re + z.im * z.im)/200), 0)" }
]

