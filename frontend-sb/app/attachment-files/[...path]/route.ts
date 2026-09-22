const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://alfiyah.my.id").replace(/\/+$/, "")

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  if (path.length !== 2 || path[0] !== "file-pendukung" || path[1].includes("..")) {
    return new Response("Lampiran tidak valid", { status: 400 })
  }

  const upstream = await fetch(
    `${API_URL}/uploads/${path.map(encodeURIComponent).join("/")}`,
    { cache: "no-store" }
  )
  if (!upstream.ok) {
    return new Response("Lampiran tidak ditemukan", { status: upstream.status })
  }

  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(path[1])}`,
    "Content-Security-Policy": "frame-ancestors 'self'",
    "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  })
  const contentLength = upstream.headers.get("content-length")
  if (contentLength) headers.set("Content-Length", contentLength)

  return new Response(upstream.body, { headers })
}
