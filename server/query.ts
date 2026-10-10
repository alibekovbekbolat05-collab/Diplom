import { isIP } from "node:net";
import type { SecurityEvent } from "./schema";
import { fields, fieldValue } from "./rules";
import { ApiError } from "./http";
function ipv4(ip: string) {
  if (isIP(ip) !== 4) return null;
  const parts = ip.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)
  )
    return null;
  return parts.reduce((s, p) => (s << 8) | p, 0) >>> 0;
}
function ipv6(ip: string) {
  if (isIP(ip) !== 6) return null;
  let text = ip.toLowerCase();
  if (text.includes(".")) {
    const cut = text.lastIndexOf(":");
    const v = ipv4(text.slice(cut + 1));
    if (v === null) return null;
    text =
      text.slice(0, cut) +
      ":" +
      ((v >>> 16) & 65535).toString(16) +
      ":" +
      (v & 65535).toString(16);
  }
  const parts = text.split("::"),
    left = parts[0] ? parts[0].split(":") : [],
    right = parts[1] ? parts[1].split(":") : [];
  const words =
    parts.length === 2
      ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right]
      : left;
  return words.reduce(
    (value, word) => (value << 16n) | BigInt(parseInt(word, 16)),
    0n,
  );
}
export function cidrMatch(ip: string, range: string) {
  const parts = range.split("/");
  if (parts.length !== 2) return false;
  const [base, bitsText] = parts;
  if (!/^\d+$/.test(bitsText)) return false;
  const bits = Number(bitsText);
  if (ip.includes(":")) {
    const a = ipv6(ip),
      b = ipv6(base);
    if (a === null || b === null || bits < 0 || bits > 128) return false;
    const shift = BigInt(128 - bits);
    return a >> shift === b >> shift;
  }
  const a = ipv4(ip),
    b = ipv4(base);
  if (
    a === null ||
    b === null ||
    !Number.isInteger(bits) ||
    bits < 0 ||
    bits > 32
  )
    return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (a & mask) === (b & mask);
}
export function compileQuery(query: string): (e: SecurityEvent) => boolean {
  if (query.length > 1024) throw new ApiError(400, "query_too_long");
  if (!query.trim()) return () => true;
  const tokens = query.match(/(?:[^\s()"]+|"(?:[^"\\]|\\.)*")+|[()]/g) || [];
  if (tokens.length > 100) throw new ApiError(400, "query_too_complex");
  let pos = 0;
  type Predicate = (e: SecurityEvent) => boolean;
  function atom(): Predicate {
    const token = tokens[pos++];
    if (!token) throw new ApiError(400, "invalid_query");
    if (token.toUpperCase() === "NOT") {
      const next = atom();
      return (e) => !next(e);
    }
    if (token === "(") {
      const result = or();
      if (tokens[pos++] !== ")") throw new ApiError(400, "invalid_query");
      return result;
    }
    if (token === ")") throw new ApiError(400, "invalid_query");
    const colon = token.indexOf(":");
    if (colon < 0) {
      const value = token.replace(/^"|"$/g, "").toLowerCase();
      return (e) => JSON.stringify(e).toLowerCase().includes(value);
    }
    const field = token.slice(0, colon),
      value = token.slice(colon + 1).replace(/^"|"$/g, "");
    if (!(fields as readonly string[]).includes(field) || !value)
      throw new ApiError(400, "invalid_query_field");
    return (e) => {
      const actual = fieldValue(e, field);
      return typeof actual === "string" &&
        value.includes("/") &&
        field.endsWith("ip")
        ? cidrMatch(actual, value)
        : String(actual ?? "").toLowerCase() === value.toLowerCase();
    };
  }
  function and(): Predicate {
    let left = atom();
    while (
      pos < tokens.length &&
      tokens[pos] !== ")" &&
      tokens[pos].toUpperCase() !== "OR"
    ) {
      if (tokens[pos].toUpperCase() === "AND") pos++;
      const right = atom(),
        previous = left;
      left = (e) => previous(e) && right(e);
    }
    return left;
  }
  function or(): Predicate {
    let left = and();
    while (tokens[pos]?.toUpperCase() === "OR") {
      pos++;
      const right = and(),
        previous = left;
      left = (e) => previous(e) || right(e);
    }
    return left;
  }
  const predicate = or();
  if (pos !== tokens.length) throw new ApiError(400, "invalid_query");
  return predicate;
}
