
class Complex {
    constructor(re, im) {
        this.re = re
        this.im = im
    }

    add(other) {
        if (!(other instanceof Complex))
            return new Complex(this.re + other, this.im)
        return new Complex(this.re + other.re, this.im + other.im)
    }

    sub(other) {
        if (!(other instanceof Complex))
            return new Complex(this.re - other, this.im)
        return new Complex(this.re - other.re, this.im - other.im)
    }

    mul(other) {
        if (!(other instanceof Complex))
            return new Complex(this.re * other, this.im * other)
        return new Complex(
            this.re * other.re - this.im * other.im,
            this.re * other.im + this.im * other.re
        )
    }

    div(other) {
        if (!(other instanceof Complex))
            return new Complex(this.re / other, this.im / other)
        const denom = other.re * other.re + other.im * other.im
        return new Complex(
            (this.re * other.re + this.im * other.im) / denom,
            (this.im * other.re - this.re * other.im) / denom
        )
    }

    abs() {
        return Math.sqrt(this.re * this.re + this.im * this.im)
    }

    log() {
        return new Complex(Math.log(this.abs()), Math.atan2(this.im, this.re))
    }

    exp() {
        const exp_re = Math.exp(this.re)
        return new Complex(exp_re * Math.cos(this.im), exp_re * Math.sin(this.im))
    }

    pow(other) {
        if (!(other instanceof Complex))
            return this.log().mul(new Complex(other, 0)).exp()
        return this.log().mul(other).exp()
    }

    sin() {
        return new Complex(
            Math.sin(this.re) * Math.cosh(this.im),
            Math.cos(this.re) * Math.sinh(this.im)
        )
    }

    cos() {
        return new Complex(
            Math.cos(this.re) * Math.cosh(this.im),
            -Math.sin(this.re) * Math.sinh(this.im)
        )
    }

    tan() {
        return this.sin().div(this.cos())
    }

    conj() {
        return new Complex(this.re, -this.im)
    }

    sqrt() {
        const r = this.abs()
        const theta = Math.atan2(this.im, this.re)
        return new Complex(
            Math.sqrt(r) * Math.cos(theta / 2),
            Math.sqrt(r) * Math.sin(theta / 2)
        )
    }

    toString() {
        return `${this.re} + ${this.im}i`
    }
}

/* Pseudo Code Pour Zeta (Borwein's algorithm)
function zeta(s):
    n = nombre de termes (14)
    neg_s = -s
    sum1 = 0
    pour k de 0 à n-1:
        term = 0
        pour j de 0 à k:
            binom = binomial(k, j)
            term += (-1)^j * (j + 1)^neg_s * binom
        sum1 += term / (2^(k + 1))
    result = sum1 / (1 - 2^(1 - s))
    return Re(result) // On prend la partie réelle pour la hauteur
*/


// Riemann Zeta Function (Borwein's algorithm)
function zeta(x, y) {
    const s = new Complex(x, y)
    const n = 7; // Number of terms, can be adjusted for precision

    const neg_s = s.mul(new Complex(-1, 0))

    let sum1 = new Complex(0, 0)
    for (let k = 0; k < n; k++) {
        let term = new Complex(0, 0)
        for (let j = 0; j <= k; j++) {
            const binom                 = factorial(k) / (factorial(j) * factorial(k - j))
            const inner_term            = new Complex(j + 1, 0).pow(neg_s); // (j+1)^(-s)
            if (j % 2 !== 0)    term    = term.sub(inner_term.mul(new Complex(binom, 0)))
            else                term    = term.add(inner_term.mul(new Complex(binom, 0)))
        }
        sum1                            = sum1.add(term.div(new Complex(2, 0).pow(new Complex(k + 1, 0))))
    }

    const one_minus_2_pow_1_minus_s     = new Complex(1, 0).sub(new Complex(2, 0).pow(new Complex(1, 0).sub(s)))
    const result                        = sum1.div(one_minus_2_pow_1_minus_s)
    
    let real_part                       = result.re

    const CLAMP_VALUE = 50
    if (!isFinite(real_part)) real_part = real_part > 0 ? CLAMP_VALUE : -CLAMP_VALUE
                              real_part = Math.max(-CLAMP_VALUE, Math.min(CLAMP_VALUE, real_part))

    return real_part * shape.depth_scale
}

// function zeta(x, y) {
//     const s = new Complex(x, y)
//     if (s.re < 1) {
//         return 0; // Zeta function is not defined for Re(s) < 1
//     }

//     const N = 100; // Number of terms to sum
//     let sum = new Complex(0, 0)
//     for (let n = 1; n <= N; n++) {
//         sum = sum.add(new Complex(1, 0).div(new Complex(n, 0).pow(s)))
//     }

//     // Euler-Maclaurin correction terms
//     const correction1 = new Complex(N, 0).pow(new Complex(1 - s.re, -s.im)).div(s.sub(new Complex(1, 0)))
//     const correction2 = new Complex(0.5, 0).mul(new Complex(N, 0).pow(new Complex(-s.re, -s.im)))
//     sum = sum.add(correction1).add(correction2)

//     let real_part = sum.re

//     const CLAMP_VALUE = 50
//     if (!isFinite(real_part)) {
//         real_part = real_part > 0 ? CLAMP_VALUE : -CLAMP_VALUE
//     }
//     real_part = Math.max(-CLAMP_VALUE, Math.min(CLAMP_VALUE, real_part))

//     return real_part * shape.depth_scale
// }

function mapRange(value, in_min, in_max, out_min, out_max) {
  return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
}

function mandelbrot(x, y) {
    const mapped_x  = mapRange(x, shape.x_min, shape.x_max, -2, 2)
    const mapped_y  = mapRange(y, shape.y_min, shape.y_max, -2, 2)
    const c         = new Complex(mapped_x, mapped_y)
    let z           = new Complex(0, 0)
    const max_iter  = 50

    let n           = 0
    for (n = 0; n < max_iter; n++) {
        if (z.abs() > 2.0) break
        z = z.mul(z).add(c)
    }
    
    // Scale and shift the iteration count for better visualization
    const height = (n === max_iter) ? 0 : (n / max_iter) * 200 - 100
    return height * shape.depth_scale
}

function burningShip(x, y) {
    const mapped_x  = mapRange(x, shape.x_min, shape.x_max, -2, 2)
    const mapped_y  = mapRange(y, shape.y_min, shape.y_max, -2, 2)
    const c         = new Complex(mapped_x, mapped_y)
    let z           = new Complex(0, 0)
    const max_iter  = 50

    let n           = 0
    for (n = 0; n < max_iter; n++) {
        if (z.abs() > 2.0) break

        // Take absolute values of real and imaginary parts before squaring
        z = new Complex(Math.abs(z.re), Math.abs(z.im))
        z = z.mul(z).add(c)
    }

    const height = (n === max_iter) ? 0 : (n / max_iter) * 200 - 100
    return height * shape.depth_scale
}

function julia(x, y) {
    const c         = new Complex(-0.7, 0.27015)
    
    const mapped_x  = mapRange(x, shape.x_min, shape.x_max, -2, 2)
    const mapped_y  = mapRange(y, shape.y_min, shape.y_max, -2, 2)
    let z           = new Complex(mapped_x, mapped_y)
    const max_iter  = 50

    let n           = 0
    for (n = 0; n < max_iter; n++) {
        if (z.abs() > 2.0) break
        z = z.mul(z).add(c)
    }
    const height = (n === max_iter) ? 0 : (n / max_iter) * 200 - 100
    return height * shape.depth_scale
}

function factorial(num) {
    if (num < 0) return -1
    else if (num == 0) return 1
    else {
        return (num * factorial(num - 1))
    }
}
